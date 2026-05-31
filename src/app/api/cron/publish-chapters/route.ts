import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// POST /api/cron/publish-chapters - Publish scheduled chapters
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !expectedAuth || authHeader.length !== expectedAuth.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const chapters = await prisma.chapter.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        manga: {
          select: { id: true, title: true, slug: true, coverUrl: true, authorId: true },
        },
      },
    });

    const updated = await prisma.chapter.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      data: { status: 'PUBLISHED' },
    });

    // Notify followers of newly published chapters
    for (const chapter of chapters) {
      try {
        const followers = await prisma.userManga.findMany({
          where: { mangaId: chapter.mangaId },
          select: { userId: true },
        });

        if (followers.length > 0) {
          const followerIds = followers.map((f: any) => f.userId);

          // In-app notifications
          const { getNotificationService } = await import('@/core/services/NotificationService');
          await (await getNotificationService()).notifyMultiple(
            followerIds,
            {
              type: 'NEW_CHAPTER',
              title: '📖 Nuevo Capítulo Publicado',
              message: `${chapter.manga.title} - Capítulo ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`,
              data: {
                mangaId: chapter.manga.id,
                mangaTitle: chapter.manga.title,
                chapterId: chapter.id,
                chapterNumber: chapter.chapterNumber,
                chapterTitle: chapter.title,
                coverUrl: chapter.manga.coverUrl,
              },
              imageUrl: chapter.manga.coverUrl || undefined,
              linkUrl: `/manga/${chapter.manga.slug}/${chapter.chapterNumber}`,
            }
          );

          // Push notifications
          const { getNotificationQueue } = await import('@/infrastructure/queue/NotificationQueue');
          getNotificationQueue().addBulkPushNotification({
            userIds: followerIds,
            payload: {
              title: '📖 Nuevo Capítulo',
              body: `${chapter.manga.title} - Capítulo ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`,
              url: `/manga/${chapter.manga.slug}/${chapter.chapterNumber}`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: `new-chapter-${chapter.id}`,
            },
          }).catch(err => console.error('[CronPublish] Error queueing push:', err));
        }
      } catch (notifyError) {
        console.error(`[CronPublish] Error notifying for chapter ${chapter.id}:`, notifyError);
      }
    }

    return NextResponse.json({
      published: updated.count,
      chapters: chapters.map(c => c.id),
    });
  } catch (error) {
    console.error('Publish chapters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
