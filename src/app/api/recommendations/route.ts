import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/recommendations
 * Collaborative filtering recommendations based on ratings.
 * Returns manga that users with similar rating patterns also liked.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Return trending manga for non-authenticated users
      const trending = await prisma.mangaSeries.findMany({
        where: { deletedAt: null, rating: { not: null } },
        orderBy: { totalViews: 'desc' },
        take: 12,
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
      return NextResponse.json({ recommendations: trending, type: 'trending' });
    }

    const userId = session.user.id;
    const limit = Math.min(20, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '12')));

    // 1. Get user's rated manga IDs
    const userReviews = await prisma.review.findMany({
      where: { userId, rating: { gte: 3 } }, // Only positive ratings
      select: { mangaId: true, rating: true },
    });

    const userMangaIds = userReviews.map((r) => r.mangaId);

    if (userMangaIds.length === 0) {
      // Fallback: top-rated manga
      const topRated = await prisma.mangaSeries.findMany({
        where: { deletedAt: null, rating: { not: null } },
        orderBy: { rating: 'desc' },
        take: limit,
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
      return NextResponse.json({ recommendations: topRated, type: 'top-rated' });
    }

    // 2. Find users who rated the same manga positively
    const similarUsers = await prisma.review.findMany({
      where: {
        mangaId: { in: userMangaIds },
        rating: { gte: 3 },
        userId: { not: userId },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const similarUserIds = similarUsers.map((u) => u.userId);

    if (similarUserIds.length === 0) {
      // Fallback: manga in same genres
      const mangaWithGenres = await prisma.mangaGenre.findMany({
        where: { mangaId: { in: userMangaIds } },
        select: { genreId: true },
        distinct: ['genreId'],
      });
      const genreIds = mangaWithGenres.map((g) => g.genreId);

      const similarGenreManga = await prisma.mangaGenre.findMany({
        where: {
          genreId: { in: genreIds },
          mangaId: { notIn: userMangaIds },
          manga: { deletedAt: null },
        },
        select: {
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
        take: limit,
        orderBy: { manga: { rating: 'desc' } },
      });

      const recommendations = similarGenreManga
        .map((g) => g.manga)
        .filter((m, i, arr) => arr.findIndex((a) => a.id === m.id) === i)
        .slice(0, limit);

      return NextResponse.json({ recommendations, type: 'genre-based' });
    }

    // 3. Find manga that similar users rated highly, that the user hasn't rated
    const recommendations = await prisma.review.findMany({
      where: {
        userId: { in: similarUserIds },
        rating: { gte: 4 },
        mangaId: { notIn: userMangaIds },
        manga: { deletedAt: null },
      },
      select: {
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
      orderBy: { rating: 'desc' },
      take: limit * 2,
    });

    // Deduplicate and score by frequency
    const recMap = new Map<string, { manga: typeof recommendations[0]['manga']; score: number }>();
    recommendations.forEach((r: typeof recommendations[0]) => {
      const existing = recMap.get(r.manga.id);
      if (existing) {
        existing.score += r.manga.rating || 0;
      } else {
        recMap.set(r.manga.id, { manga: r.manga, score: r.manga.rating || 0 });
      }
    });

    const sorted = [...recMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.manga);

    return NextResponse.json({ recommendations: sorted, type: 'collaborative' });
  } catch (error) {
    console.error('[Recommendations API]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
