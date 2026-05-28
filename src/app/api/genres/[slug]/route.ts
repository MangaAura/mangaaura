import { NextRequest, NextResponse } from 'next/server';

import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cacheKey = generateCacheKey('genre:slug', { slug });

    const result = await withCache(cacheKey, cacheConfig.manga.list.ttl, async () => {
      const genre = await prisma.genre.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true },
      });

      if (!genre) {
        throw new Error('NOT_FOUND');
      }

      const mangas = await prisma.mangaSeries.findMany({
        where: {
          deletedAt: null,
          mangaGenres: {
            some: { genre: { slug } },
          },
          status: { not: 'DRAFT' },
        },
        orderBy: { totalViews: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          description: true,
          authorName: true,
          status: true,
          rating: true,
          totalViews: true,
          createdAt: true,
          mangaGenres: {
            select: {
              genre: { select: { name: true, slug: true } },
            },
          },
          _count: { select: { chapters: true, libraryEntries: true } },
        },
      });

      return {
        genre,
        mangas: mangas.map((m) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          coverUrl: m.coverUrl,
          description: m.description,
          authorName: m.authorName,
          status: m.status,
          rating: m.rating,
          totalViews: m.totalViews,
          genres: m.mangaGenres.map((mg) => mg.genre.name),
          createdAt: m.createdAt.toISOString(),
          chapterCount: m._count.chapters,
          libraryCount: m._count.libraryEntries,
        })),
        totalMangas: mangas.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }
    console.error('Error fetching genre page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}