import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/manga/[id]/similar - Mangas similares basados en géneros compartidos
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Find manga by id or slug
    const manga = await prisma.mangaSeries.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!manga) {
      return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    }

    // Get genre IDs for this manga
    const mangaGenres = await prisma.mangaGenre.findMany({
      where: { mangaId: manga.id },
      select: { genreId: true },
    });

    const genreIds = mangaGenres.map((g) => g.genreId);

    if (genreIds.length === 0) {
      // Fallback: return top-rated manga
      const topRated = await prisma.mangaSeries.findMany({
        where: { deletedAt: null, id: { not: manga.id }, rating: { not: null } },
        orderBy: { rating: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          status: true,
          rating: true,
          totalViews: true,
          authorName: true,
          _count: { select: { chapters: true } },
        },
      });
      return NextResponse.json({ recommendations: topRated });
    }

    // Find mangas that share genres, ordered by number of shared genres
    const similar = await prisma.mangaGenre.findMany({
      where: {
        genreId: { in: genreIds },
        mangaId: { not: manga.id },
        manga: { deletedAt: null },
      },
      select: {
        mangaId: true,
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            status: true,
            rating: true,
            totalViews: true,
            authorName: true,
            _count: { select: { chapters: true } },
          },
        },
      },
    });

    // Count shared genres and deduplicate
    const genreCount = new Map<string, { manga: (typeof similar)[0]['manga']; count: number }>();
    for (const s of similar) {
      const existing = genreCount.get(s.mangaId);
      if (existing) {
        existing.count++;
      } else {
        genreCount.set(s.mangaId, { manga: s.manga, count: 1 });
      }
    }

    const recommendations = [...genreCount.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((r) => r.manga);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('[SimilarManga API]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
