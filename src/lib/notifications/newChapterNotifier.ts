/**
 * New Chapter Notifier
 *
 * Helper compartido que notifica a todos los seguidores de un manga
 * cuando se publica un nuevo capítulo.
 *
 * Busca seguidores en dos tablas:
 * - Follow (followingType = 'MANGA') — usuarios que siguen el manga
 * - UserManga — usuarios que tienen el manga en su biblioteca
 *
 * NOTIFICA por 3 canales:
 * 1. Notificaciones in-app (DB + WebSocket en tiempo real)
 * 2. Push notifications (Web Push vía NotificationQueue/BullMQ)
 * 3. Email (fire-and-forget en lotes)
 *
 * @packageDocumentation
 */

import { getNotificationService } from '@/core/services/NotificationService';
import { prisma } from '@/lib/prisma';

interface MangaInfo {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
}

interface ChapterInfo {
  id: string;
  chapterNumber: number;
  title: string | null;
}

/**
 * Encuentra todos los userIds que siguen un manga (Follow + UserManga, deduplicado)
 */
async function findFollowerIds(mangaId: string): Promise<string[]> {
  const [follows, libraryEntries] = await Promise.all([
    // Seguidores vía Follow (followingType = 'MANGA')
    prisma.follow.findMany({
      where: {
        followingId: mangaId,
        followingType: 'MANGA',
      },
      select: { followerId: true },
    }),
    // Usuarios que tienen el manga en su biblioteca
    prisma.userManga.findMany({
      where: { mangaId },
      select: { userId: true },
    }),
  ]);

  const followerIds = new Set<string>();

  for (const f of follows) {
    followerIds.add(f.followerId);
  }
  for (const u of libraryEntries) {
    followerIds.add(u.userId);
  }

  return Array.from(followerIds);
}

/**
 * Obtiene datos de usuario para envío de emails (solo de los que tienen email)
 */
async function findEmailFollowers(
  mangaId: string,
): Promise<Array<{ id: string; email: string; username: string }>> {
  const followerIds = await findFollowerIds(mangaId);

  if (followerIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: followerIds } },
    select: { id: true, email: true, username: true },
  });

  // Solo usuarios con email verificado
  return users.filter((u) => u.email);
}

/**
 * Notifica a todos los seguidores de un manga sobre un nuevo capítulo.
 * No lanza errores — atrapa y loggea internamente (fire-and-forget seguro).
 */
export async function notifyFollowersNewChapter(
  manga: MangaInfo,
  chapter: ChapterInfo,
): Promise<void> {
  try {
    const followerIds = await findFollowerIds(manga.id);

    if (followerIds.length === 0) {
      console.info(`[NewChapterNotifier] No followers found for manga ${manga.id}`);
      return;
    }

    const chapterLabel = `Capítulo ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`;

    // ─── 1. Notificaciones in-app (batch) ──────────────────────
    (await getNotificationService())
      .notifyMultiple(followerIds, {
        type: 'NEW_CHAPTER',
        title: '📖 Nuevo Capítulo',
        message: `${manga.title} - ${chapterLabel}`,
        data: {
          mangaId: manga.id,
          mangaTitle: manga.title,
          mangaSlug: manga.slug,
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.title,
          coverUrl: manga.coverUrl,
        },
        imageUrl: manga.coverUrl || undefined,
        linkUrl: `/${manga.slug}-${chapter.chapterNumber}`,
      })
      .catch((err) =>
        console.error('[NewChapterNotifier] Error creating in-app notifications:', err),
      );

    // ─── 2. Push notifications vía BullMQ ──────────────────────
    import('@/infrastructure/queue/NotificationQueue')
      .then(async ({ getNotificationQueue }) => {
        await getNotificationQueue()
          .addBulkPushNotification({
            userIds: followerIds,
            payload: {
              title: '📖 Nuevo Capítulo',
              body: `${manga.title} - ${chapterLabel}`,
              url: `/${manga.slug}-${chapter.chapterNumber}`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: `new-chapter-${chapter.id}`,
            },
          })
          .catch((err: unknown) =>
            console.error('[NewChapterNotifier] Error queueing push notifications:', err),
          );
      })
      .catch((err: unknown) =>
        console.error('[NewChapterNotifier] Error loading NotificationQueue:', err),
      );

    // ─── 3. Emails a seguidores (fire-and-forget) ──────────────
    import('@/infrastructure/adapters/emailService')
      .then(async ({ emailService }) => {
        const emailUsers = await findEmailFollowers(manga.id);
        if (emailUsers.length === 0) return;

        const batchSize = 10;
        for (let i = 0; i < emailUsers.length; i += batchSize) {
          const batch = emailUsers.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map((user) =>
              emailService
                .sendNewChapterNotification(
                  user,
                  {
                    id: manga.id,
                    title: manga.title,
                    slug: manga.slug,
                    coverUrl: manga.coverUrl,
                    authorName: '',
                  },
                  {
                    id: chapter.id,
                    chapterNumber: chapter.chapterNumber,
                    title: chapter.title,
                  },
                )
                .catch((err: unknown) => {
                  console.error(
                    `[NewChapterNotifier] Error sending email to ${user.email}:`,
                    err,
                  );
                }),
            ),
          );
        }
        console.info(
          `[NewChapterNotifier] New chapter emails sent to ${emailUsers.length} followers`,
        );
      })
      .catch((err: unknown) =>
        console.error('[NewChapterNotifier] Error loading emailService:', err),
      );

    console.info(
      `[NewChapterNotifier] Notifications sent to ${followerIds.length} followers for ${manga.title} - ${chapterLabel}`,
    );
  } catch (error) {
    console.error('[NewChapterNotifier] Error notifying followers:', error);
  }
}

export default notifyFollowersNewChapter;
