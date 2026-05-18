/**
 * Rankings API - Optimized for performance
 *
 * GET: Rankings de mangas por diferentes criterios
 */

import { NextRequest, NextResponse } from 'next/server';

import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

// Using Node.js runtime for database access
// export const runtime = 'edge';
// export const preferredRegion = 'auto';

// Predefined sort orders to avoid object creation
const SORT_ORDERS = {
  popularity: { totalViews: 'desc' as const },
  rating: { rating: 'desc' as const },
  newest: { createdAt: 'desc' as const },
  views: { totalViews: 'desc' as const },
  trending: { totalViews: 'desc' as const },
  updated: { updatedAt: 'desc' as const },
};

// Predefined date calculations (cached)
const DATE_CACHE = new Map<string, Date>();

function getDateForRange(timeRange: string): Date | undefined {
  if (timeRange === 'all') return undefined;

  const cached = DATE_CACHE.get(timeRange);
  if (cached) return cached;

  const now = new Date();
  let result: Date;

  switch (timeRange) {
    case 'day':
      result = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      result = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      result = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }

  DATE_CACHE.set(timeRange, result);
  return result;
}

/**
 * GET /api/rankings
 * Query params:
 * - type: popularity|rating|trending|newest|views
 * - timeRange: day|week|month|all
 * - genre: filter by genre
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'popularity';
    const timeRange = searchParams.get('timeRange') || 'all';
    const genre = searchParams.get('genre');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));

    // Validate type
    const validType = SORT_ORDERS[type as keyof typeof SORT_ORDERS] ? type : 'popularity';

    // Generate cache key
    const cacheKey = generateCacheKey('rankings', { type: validType, timeRange, genre, page, limit });

    const result = await withCache(
      cacheKey,
      cacheConfig.manga.list.ttl,
      async () => {
        // Calculate date filter based on timeRange
        const dateFilter = getDateForRange(timeRange);

        // Build where clause with type safety
        const where: any = {};

        if (genre) {
          where.tags = { contains: genre };
        }

        // Get sort order from predefined constants
        const orderBy = SORT_ORDERS[validType as keyof typeof SORT_ORDERS] || SORT_ORDERS.popularity;

        // Apply rating filter for rating type
        if (validType === 'rating') {
          where.rating = { not: null };
        }

        // Apply date filter for trending
        if (validType === 'trending' && dateFilter) {
          where.updatedAt = { gte: dateFilter };
        }

        // Optimized select - only fetch necessary fields
        const select = {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          authorName: true,
          status: true,
          totalViews: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              chapters: true,
            },
          },
        };

        // Execute query with Promise.all for parallel execution
        const [mangas, total] = await Promise.all([
          prisma.mangaSeries.findMany({
            where,
            select,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.mangaSeries.count({ where }),
        ]);

        // Calculate ranks and transform data
        const rankedMangas = mangas.map((manga: any, index: any) => ({
          rank: (page - 1) * limit + index + 1,
          id: manga.id,
          title: manga.title,
          slug: manga.slug,
          coverUrl: manga.coverUrl,
          authorName: manga.authorName,
          status: manga.status,
          totalViews: manga.totalViews,
          rating: manga.rating,
          chapterCount: manga._count?.chapters || 0,
          createdAt: manga.createdAt.toISOString(),
          updatedAt: manga.updatedAt.toISOString(),
          score: validType === 'rating' ? manga.rating : manga.totalViews,
        }));

        return {
          mangas: rankedMangas,
          results: rankedMangas, // For backward compatibility
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
          meta: {
            type: validType,
            timeRange,
            genre,
          },
      };
    }
  );

  // Add cache headers
  const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    headers.set('X-Cache', 'HIT');

    return NextResponse.json(result, { headers });
  } catch (error: unknown) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
