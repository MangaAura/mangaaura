import { NextRequest, NextResponse } from 'next/server';

import { getNotificationService } from '@/core/services/NotificationService';
import { withCache, generateCacheKey, cacheConfig, invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/manga/[id]/chapters - Listar capítulos del manga
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que el manga existe y no está eliminado
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Generate cache key
    const cacheKey = generateCacheKey('manga:chapters:list', {
      mangaId: id,
      page,
      limit,
    });

    const result = await withCache(
      cacheKey,
      cacheConfig.manga.list.ttl,
      async () => {
        const [chapters, total] = await Promise.all([
          prisma.chapter.findMany({
            where: { mangaId: id },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { chapterNumber: 'asc' },
            select: {
              id: true,
              chapterNumber: true,
              title: true,
              totalPages: true,
              createdAt: true,
              viewCount: true,
              crowdfundingGoal: true,
              crowdfundingCurrent: true,
              isCrowdfunded: true,
            },
          }),
          prisma.chapter.count({ where: { mangaId: id } }),
        ]);

        return {
          chapters: chapters.map((ch: any) => ({
            id: ch.id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            totalPages: ch.totalPages,
            createdAt: ch.createdAt,
            viewCount: ch.viewCount,
            crowdfunding: ch.crowdfundingGoal
              ? {
                  goal: ch.crowdfundingGoal,
                  current: ch.crowdfundingCurrent,
                  isFunded: ch.isCrowdfunded,
                  progress: Math.round((ch.crowdfundingCurrent / ch.crowdfundingGoal) * 100),
                }
              : null,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    );

    // Add cache headers
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error listando capítulos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/manga/[id]/chapters - Crear capítulo
export async function POST(
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

    const { id } = await params;
    const body = await request.json();
    const { chapterNumber, title, pageUrls, coverUrl } = body;

    // Verificar que el manga existe y el usuario es el autor
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true, title: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    if (manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para agregar capítulos a este manga' },
        { status: 403 }
      );
    }

    // Validaciones
    if (chapterNumber === undefined || chapterNumber === null) {
      return NextResponse.json(
        { error: 'El número de capítulo es requerido' },
        { status: 400 }
      );
    }

    const chapterNum = parseInt(chapterNumber);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'El número de capítulo debe ser un entero positivo' },
        { status: 400 }
      );
    }

    // Verificar que chapterNumber sea único
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        mangaId_chapterNumber: {
          mangaId: id,
          chapterNumber: chapterNum,
        },
      },
    });

    if (existingChapter) {
      return NextResponse.json(
        { error: `El capítulo ${chapterNum} ya existe en este manga` },
        { status: 409 }
      );
    }

    // Validar pageUrls (opcional en creación, se actualizará después)
    const validUrls = Array.isArray(pageUrls)
      ? pageUrls.filter((url: string) => typeof url === 'string' && url.trim() !== '')
      : [];

    const totalPages = validUrls.length;

    const chapter = await prisma.chapter.create({
      data: {
        mangaId: id,
        chapterNumber: chapterNum,
        title: title || null,
        totalPages,
        pageUrls: JSON.stringify(validUrls),
        coverUrl: coverUrl || null,
      },
    });

    // Actualizar la fecha de actualización del manga
    await prisma.mangaSeries.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Invalidar caches
    await invalidateCache('manga:chapters:list');
    await invalidateCache(`manga:${id}`);
    await invalidateCache('user:mangas:list');
    await invalidateCache('stats:homepage');

    // Notificar a seguidores del manga
    try {
      const followers = await prisma.userManga.findMany({
        where: { mangaId: id },
        include: { user: { select: { id: true, email: true, username: true } } },
      });

      if (followers.length > 0) {
        const mangaData = await prisma.mangaSeries.findUnique({
          where: { id },
        });

        if (mangaData) {
          const followerIds = followers.map((f: any) => f.userId);

          // Notificaciones in-app (batch insert en DB)
          (await getNotificationService()).notifyMultiple(
            followerIds,
            {
              type: 'NEW_CHAPTER',
              title: '📖 Nuevo Capítulo',
              message: `${mangaData.title} - Capítulo ${chapterNum}${title ? `: ${title}` : ''}`,
              data: {
                mangaId: id,
                mangaTitle: mangaData.title,
                chapterId: chapter.id,
                chapterNumber: chapterNum,
                chapterTitle: title,
                coverUrl: mangaData.coverUrl,
              },
              imageUrl: mangaData.coverUrl || undefined,
              linkUrl: `/manga/${mangaData.slug}/chapter/${chapterNum}`,
            }
          ).catch(err => console.error('Error notifying followers:', err));

          // Push notifications via BullMQ (asíncrono, con retries)
          const { getNotificationQueue } = await import('@/infrastructure/queue/NotificationQueue');
          getNotificationQueue().addBulkPushNotification({
            userIds: followerIds,
            payload: {
              title: '📖 Nuevo Capítulo',
              body: `${mangaData.title} - Capítulo ${chapterNum}${title ? `: ${title}` : ''}`,
              url: `/manga/${mangaData.slug}/chapter/${chapterNum}`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: `new-chapter-${chapter.id}`,
            },
          }).catch(err => console.error('[NewChapter] Error queueing push notifications:', err));

          // Emails a seguidores (asincrono)
          const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
          const emailQueue = getEmailQueue();

          // Procesar en lotes de 50 para evitar sobrecarga
          const batchSize = 50;
          for (let i = 0; i < followers.length; i += batchSize) {
            const batch = followers.slice(i, i + batchSize);
            await Promise.all(
              batch.map((follower: any) =>
                emailQueue.addNewChapterEmail({
                  to: follower.user.email,
                  userId: follower.user.id,
                  username: follower.user.username,
                  mangaId: id,
                  mangaTitle: mangaData.title,
                  mangaSlug: mangaData.slug,
                  mangaCoverUrl: mangaData.coverUrl,
                  chapterId: chapter.id,
                  chapterNumber: chapterNum,
                  chapterTitle: title || undefined,
                }).catch(err => {
                  console.error(`[NewChapter] Error queueing email for ${follower.user.email}:`, err);
                })
              )
            );
          }
        }
      }
    } catch (notifyError) {
      console.error('Error notifying followers of new chapter:', notifyError);
    }

    return NextResponse.json(
      {
        message: 'Capítulo creado exitosamente',
        chapter: {
          id: chapter.id,
          mangaId: chapter.mangaId,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          coverUrl: chapter.coverUrl,
          totalPages: chapter.totalPages,
          pageUrls: validUrls,
          createdAt: chapter.createdAt,
          viewCount: chapter.viewCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
