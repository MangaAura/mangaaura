import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNotificationService } from '@/core/services/NotificationService';
import { invalidateCache } from '@/lib/apiCache';
import { getEmailQueue } from '@/infrastructure/queue/EmailQueue';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// PATCH /api/chapters/[id]/finalize - Finalize chapter upload
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const { id: chapterId } = await params;

    // Get chapter with manga info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            authorId: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (chapter.manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para finalizar este capítulo' },
        { status: 403 }
      );
    }

    // Parse pageUrls to verify images are uploaded
    let pageUrls: string[] = [];
    try {
      pageUrls = JSON.parse(chapter.pageUrls);
    } catch {
      pageUrls = [];
    }

    if (!Array.isArray(pageUrls) || pageUrls.length === 0) {
      return NextResponse.json(
        { error: 'El capítulo no tiene páginas. Sube al menos una imagen antes de finalizar.' },
        { status: 400 }
      );
    }

    // Verify all pages have valid URLs
    const validUrls = pageUrls.filter((url: string) => 
      typeof url === 'string' && url.trim() !== ''
    );

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'Las URLs de las páginas no son válidas' },
        { status: 400 }
      );
    }

    // Update chapter and manga in a transaction
    const [updatedChapter] = await prisma.$transaction([
      // Update chapter
      prisma.chapter.update({
        where: { id: chapterId },
        data: {
          totalPages: validUrls.length,
          pageUrls: JSON.stringify(validUrls),
        },
      }),
      // Update manga's updatedAt timestamp
      prisma.mangaSeries.update({
        where: { id: chapter.manga.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Invalidate caches
    await invalidateCache('manga:chapters:list');
    await invalidateCache(`manga:${chapter.manga.id}`);
    await invalidateCache(`chapter:${chapterId}`);

    // Notify followers asynchronously
    try {
      const followers = await prisma.userManga.findMany({
        where: { mangaId: chapter.manga.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (followers.length > 0) {
        const followerIds = followers.map((f: any) => f.userId);

        // Send push notifications
        (await getNotificationService())
          .notifyMultiple(followerIds, {
            type: 'NEW_CHAPTER',
            title: '📖 Nuevo Capítulo',
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
            linkUrl: `/manga/${chapter.manga.slug}/chapter/${chapter.chapterNumber}`,
          })
          .catch((err) => console.error('Error notifying followers:', err));

        // Queue email notifications
        const emailQueue = getEmailQueue();

        // Process in batches to avoid overload
        const batchSize = 50;
        for (let i = 0; i < followers.length; i += batchSize) {
          const batch = followers.slice(i, i + batchSize);
          await Promise.all(
            batch.map((follower: any) =>
              emailQueue
                .addNewChapterEmail({
                  to: follower.user.email,
                  userId: follower.user.id,
                  username: follower.user.username,
                  mangaId: chapter.manga.id,
                  mangaTitle: chapter.manga.title,
                  mangaSlug: chapter.manga.slug,
                  mangaCoverUrl: chapter.manga.coverUrl,
                  chapterId: chapter.id,
                  chapterNumber: chapter.chapterNumber,
                  chapterTitle: chapter.title || undefined,
                })
                .catch((err) => {
                  console.error(
                    `[Finalize] Error queueing email for ${follower.user.email}:`,
                    err
                  );
                })
            )
          );
        }
      }
    } catch (notifyError) {
      console.error('Error notifying followers of finalized chapter:', notifyError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Capítulo finalizado exitosamente',
      chapter: {
        id: updatedChapter.id,
        mangaId: updatedChapter.mangaId,
        chapterNumber: updatedChapter.chapterNumber,
        title: updatedChapter.title,
        totalPages: updatedChapter.totalPages,
        pageUrls: validUrls,
        createdAt: updatedChapter.createdAt,
        viewCount: updatedChapter.viewCount,
      },
    });
  } catch (error) {
    console.error('Error finalizing chapter:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
