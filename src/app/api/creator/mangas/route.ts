import { NextRequest, NextResponse } from 'next/server';

import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/mangas - Listar todos los mangas del creador logueado
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Generate cache key
    const cacheKey = generateCacheKey('creator:mangas:dashboard', {
      userId: session.user.id,
      page,
      limit,
      status: status || 'all',
      search: search || 'all',
    });

    const userId = session.user.id;
    
    const result = await withCache(
      cacheKey,
      cacheConfig.manga.list.ttl,
      async () => {
        const where: Record<string, unknown> = {
          authorId: userId,
        };

        if (status) {
          where.status = status.toUpperCase();
        }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

      const [mangas, total] = await Promise.all([
      prisma.mangaSeries.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverUrl: true,
          status: true,
          tags: true,
          rating: true,
          totalViews: true,
          createdAt: true,
          updatedAt: true,
        },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          prisma.mangaSeries.count({ where }),
        ]);

    // Obtener información de capítulos para todos los mangas - use select para evitar over-fetching
    const mangaIds = mangas.map((m) => m.id);
    const chapters = await prisma.chapter.findMany({
      where: { mangaId: { in: mangaIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        title: true,
        viewCount: true,
        createdAt: true,
      },
      take: mangaIds.length * 10, // Limit to recent chapters only for performance
    });

        // Agrupar capítulos por manga
        const chaptersByManga = new Map<string, typeof chapters>();
        chapters.forEach((ch) => {
          if (!chaptersByManga.has(ch.mangaId)) {
            chaptersByManga.set(ch.mangaId, []);
          }
          chaptersByManga.get(ch.mangaId)!.push(ch);
        });

        // Calcular estadísticas para cada manga
        const mangasWithStats = mangas.map((manga) => {
          const mangaChapters = chaptersByManga.get(manga.id) || [];
          const totalChapterViews = mangaChapters.reduce(
            (sum: number, ch) => sum + ch.viewCount,
            0
          );
          const lastUpdate =
            mangaChapters.length > 0
              ? mangaChapters[0].createdAt
              : manga.updatedAt;

          return {
            id: manga.id,
            title: manga.title,
            slug: manga.slug,
            description: manga.description,
            coverUrl: manga.coverUrl,
            status: manga.status,
            tags: manga.tags ? JSON.parse(manga.tags) : [],
            rating: manga.rating,
            totalViews: manga.totalViews,
            createdAt: manga.createdAt,
            updatedAt: manga.updatedAt,
            stats: {
              chapterCount: mangaChapters.length,
              totalChapterViews,
              lastUpdate,
            },
            recentChapters: mangaChapters.slice(0, 5).map((ch) => ({
              id: ch.id,
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              viewCount: ch.viewCount,
              createdAt: ch.createdAt,
            })),
          };
        });

        return {
          mangas: mangasWithStats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error obteniendo mangas del creador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
