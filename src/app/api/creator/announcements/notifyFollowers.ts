/**
 * Helper para notificar a todos los seguidores de un manga
 * cuando el creador publica un anuncio.
 *
 * Usa el mismo patrón que newChapterNotifier.ts pero para anuncios.
 */

import { getNotificationService } from '@/core/services/NotificationService';
import { prisma } from '@/lib/prisma';

interface MangaInfo {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
}

interface AnnouncementInfo {
  id: string;
  title: string;
  content: string;
}

/**
 * Encuentra seguidores del manga (Follow + UserManga, deduplicado)
 */
async function findFollowerIds(mangaId: string): Promise<string[]> {
  const [follows, libraryEntries] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: mangaId, followingType: 'MANGA' },
      select: { followerId: true },
    }),
    prisma.userManga.findMany({
      where: { mangaId },
      select: { userId: true },
    }),
  ]);

  const followerIds = new Set<string>();
  for (const f of follows) followerIds.add(f.followerId);
  for (const u of libraryEntries) followerIds.add(u.userId);

  return Array.from(followerIds);
}

/**
 * Notifica a todos los seguidores sobre un nuevo anuncio del creador.
 */
export async function notifyAnnouncement(
  manga: MangaInfo,
  announcement: AnnouncementInfo,
): Promise<void> {
  try {
    const followerIds = await findFollowerIds(manga.id);
    if (followerIds.length === 0) {
      console.info(`[AnnouncementNotifier] No followers for manga ${manga.id}`);
      return;
    }

    const truncatedContent =
      announcement.content.length > 120
        ? announcement.content.slice(0, 120) + '…'
        : announcement.content;

    // ─── 1. Notificaciones in-app (batch) ──────────────────────
    (await getNotificationService())
      .notifyMultiple(followerIds, {
        type: 'ANNOUNCEMENT',
        title: `📢 ${announcement.title}`,
        message: `${manga.title}: ${truncatedContent}`,
        data: {
          mangaId: manga.id,
          mangaTitle: manga.title,
          mangaSlug: manga.slug,
          announcementId: announcement.id,
          announcementTitle: announcement.title,
          coverUrl: manga.coverUrl,
        },
        imageUrl: manga.coverUrl || undefined,
        linkUrl: `/manga/${manga.slug}`,
      })
      .catch((err: unknown) =>
        console.error('[AnnouncementNotifier] Error creating in-app notifications:', err),
      );

    // ─── 2. Push notifications vía BullMQ ──────────────────────
    import('@/infrastructure/queue/NotificationQueue')
      .then(async ({ getNotificationQueue }) => {
        await getNotificationQueue()
          .addBulkPushNotification({
            userIds: followerIds,
            payload: {
              title: `📢 ${announcement.title}`,
              body: `${manga.title}: ${truncatedContent}`,
              url: `/manga/${manga.slug}`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: `announcement-${announcement.id}`,
            },
          })
          .catch((err: unknown) =>
            console.error('[AnnouncementNotifier] Error queueing push:', err),
          );
      })
      .catch((err: unknown) =>
        console.error('[AnnouncementNotifier] Error loading NotificationQueue:', err),
      );

    console.info(
      `[AnnouncementNotifier] Notifications sent to ${followerIds.length} followers for announcement "${announcement.title}"`,
    );
  } catch (error) {
    console.error('[AnnouncementNotifier] Error:', error);
  }
}
