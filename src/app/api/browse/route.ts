import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@/generated/prisma/client';
import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'popular';
    const search = searchParams.get('q');

    const cacheKey = generateCacheKey('browse', { page, limit, genre, status, sort, search });

    const result = await withCache(cacheKey, cacheConfig.manga.list.ttl, async () => {
      const where: Prisma.MangaSeriesWhereInput = {
        deletedAt: null,
      };
      if (genre) {
        where.mangaGenres = {
          some: {
            genre: { slug: genre },
          },
        };
      }
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { authorName: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const orderBy: Prisma.MangaSeriesOrderByWithRelationInput = sort === 'popular'
        ? { totalViews: 'desc' }
        : sort === 'rating'
        ? { rating: 'desc' }
        : sort === 'newest'
        ? { createdAt: 'desc' }
        : sort === 'title'
        ? { title: 'asc' }
        : { totalViews: 'desc' };

      const [mangas, total, allGenres] = await Promise.all([
        prisma.mangaSeries.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverUrl: true,
            status: true,
            authorName: true,
            rating: true,
            totalViews: true,
            createdAt: true,
            updatedAt: true,
            mangaGenres: {
              select: {
                genre: { select: { name: true, slug: true } },
              },
            },
            _count: { select: { chapters: true, libraryEntries: true } },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.mangaSeries.count({ where }),
        prisma.genre.findMany({
          orderBy: { name: 'asc' },
          select: { name: true, slug: true },
        }),
      ]);

      return {
        mangas: mangas.map((m) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          description: m.description,
          coverUrl: m.coverUrl,
          status: m.status,
          genres: m.mangaGenres.map((mg) => mg.genre.name),
          authorName: m.authorName,
          rating: m.rating,
          totalViews: m.totalViews,
          chapterCount: m._count.chapters,
          libraryCount: m._count.libraryEntries,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
        genres: allGenres,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error browsing manga:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
