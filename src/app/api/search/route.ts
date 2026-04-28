import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { Prisma } from '@prisma/client';

// Status types for manga
const VALID_STATUSES = ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED'] as const;
type MangaStatus = typeof VALID_STATUSES[number];

// Sort options - frozen for immutability
const SORT_OPTIONS = Object.freeze({
  popularity: { totalViews: 'desc' as const },
  date: { createdAt: 'desc' as const },
  rating: { rating: 'desc' as const },
  updated: { updatedAt: 'desc' as const },
  title: { title: 'asc' as const },
});

// Pre-compiled regex cache for highlight function
const regexCache = new Map<string, RegExp>();

// Highlight search terms in text
function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  
  // Use cached regex if available
  let regex = regexCache.get(query);
  if (!regex) {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    regex = new RegExp(`(${escapedQuery})`, 'gi');
    // Limit cache size
    if (regexCache.size < 100) {
      regexCache.set(query, regex);
    }
  }
  return text.replace(regex, '<mark>$1</mark>');
}

// Extract highlighted matches from manga data
function extractHighlights(manga: {
  title: string;
  description: string | null;
  authorName: string | null;
  tags: string | null;
}, query: string) {
  if (!query) return null;

  const queryLower = query.toLowerCase();
  const highlights: { field: string; snippet: string }[] = [];

  // Check title match
  if (manga.title.toLowerCase().includes(queryLower)) {
    highlights.push({
      field: 'title',
      snippet: highlightText(manga.title, query),
    });
  }

  // Check description match
  if (manga.description?.toLowerCase().includes(queryLower)) {
    const words = manga.description.split(/\s+/);
    const queryIndex = words.findIndex((w: string) =>
      w.toLowerCase().includes(queryLower)
    );
    const start = Math.max(0, queryIndex - 5);
    const end = Math.min(words.length, queryIndex + 6);
    const snippet = words.slice(start, end).join(' ');
    highlights.push({
      field: 'description',
      snippet: highlightText(snippet + (end < words.length ? '...' : ''), query),
    });
  }

  // Check author match
  if (manga.authorName?.toLowerCase().includes(queryLower)) {
    highlights.push({
      field: 'author',
      snippet: highlightText(manga.authorName, query),
    });
  }

  // Check tags match
  if (manga.tags) {
    try {
      const tags = JSON.parse(manga.tags) as string[];
      const matchingTags = tags.filter((tag: string) =>
        tag.toLowerCase().includes(queryLower)
      );
      if (matchingTags.length > 0) {
        highlights.push({
          field: 'tags',
          snippet: matchingTags.map((t: string) => highlightText(t, query)).join(', '),
        });
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  return highlights.length > 0 ? highlights : null;
}

// GET /api/search - Advanced search endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters with validation
    const query = searchParams.get('q')?.trim() || '';
    const genres = searchParams.getAll('genres[]');
    const status = searchParams.get('status') as MangaStatus | null;
    const author = searchParams.get('author')?.trim();
    const sort = searchParams.get('sort') || 'popularity';
    const minRating = Math.max(0, Math.min(5, parseFloat(searchParams.get('minRating') || '0')));
    const maxRating = Math.max(0, Math.min(5, parseFloat(searchParams.get('maxRating') || '5')));
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const cursor = searchParams.get('cursor');

    // Validate status
    const validatedStatus = status && VALID_STATUSES.includes(status) ? status : undefined;

    // Validate sort
    const sortOrder = SORT_OPTIONS[sort as keyof typeof SORT_OPTIONS] || SORT_OPTIONS.popularity;

    // Build cache key with shorter TTL for search queries
    const cacheKey = generateCacheKey('search:mangas', {
      query,
      genres,
      status: validatedStatus,
      author,
      sort,
      minRating,
      maxRating,
      tags,
      cursor,
      limit,
    });

    const result = await withCache(
      cacheKey,
      query ? 30 : cacheConfig.manga.list.ttl, // Shorter cache for search queries
      async () => {
        // Build where clause
        const where: Prisma.MangaSeriesWhereInput = {};

        // Text search with full-text capabilities - use case-insensitive search
        if (query) {
          where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { authorName: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Genre filter (using tags as genres)
        if (genres.length > 0) {
          where.AND = genres.map((genre) => ({
            tags: { contains: `"${genre.toLowerCase()}"` },
          }));
        }

        // Status filter
        if (validatedStatus) {
          where.status = validatedStatus;
        }

        // Author filter - case insensitive
        if (author) {
          where.authorName = { contains: author, mode: 'insensitive' };
        }

        // Rating range filter
        if (minRating > 0 || maxRating < 5) {
          where.rating = {
            gte: minRating,
            lte: maxRating,
          };
        }

        // Tags filter
        if (tags.length > 0) {
          const tagsFilter = tags.map((tag) => ({
            tags: { contains: `"${tag.toLowerCase().trim()}"` },
          }));
          if (where.AND) {
            where.AND = [...(Array.isArray(where.AND) ? where.AND : [where.AND]), ...tagsFilter];
          } else {
            where.AND = tagsFilter;
          }
        }

        // Optimized cursor-based pagination
        const take = limit + 1;
        let skip = 0;

        if (cursor) {
          try {
            // Decode cursor - use TextEncoder for Edge runtime compatibility
            const decodedCursor = JSON.parse(atob(cursor));
            skip = (page - 1) * limit;
          } catch {
            skip = (page - 1) * limit;
          }
        } else {
          skip = (page - 1) * limit;
        }

        // Execute search with optimized select
        const [mangas, totalCount] = await Promise.all([
          prisma.mangaSeries.findMany({
            where,
            skip,
            take,
            orderBy: sortOrder,
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              coverUrl: true,
              authorId: true,
              authorName: true,
              status: true,
              tags: true,
              totalViews: true,
              rating: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  chapters: true,
                },
              },
            },
          }),
          prisma.mangaSeries.count({ where }),
        ]);

        // Determine if there's a next page
        const hasNextPage = mangas.length > limit;
        const results = hasNextPage ? mangas.slice(0, limit) : mangas;

        // Generate next cursor using btoa for Edge runtime
        let nextCursor: string | null = null;
        if (hasNextPage && results.length > 0) {
          const lastItem = results[results.length - 1];
          const cursorData = {
            id: lastItem.id,
            sortValue: sort === 'popularity'
              ? lastItem.totalViews
              : sort === 'rating'
              ? lastItem.rating
              : sort === 'date'
              ? lastItem.createdAt.toISOString()
              : lastItem.updatedAt.toISOString(),
          };
          nextCursor = btoa(JSON.stringify(cursorData));
        }

        // Transform results with highlights
        const transformedResults = results.map((manga) => ({
          id: manga.id,
          title: manga.title,
          slug: manga.slug,
          description: manga.description,
          coverUrl: manga.coverUrl,
          authorId: manga.authorId,
          authorName: manga.authorName,
          status: manga.status,
          tags: manga.tags ? JSON.parse(manga.tags) : [],
          totalViews: manga.totalViews,
          rating: manga.rating,
          chapterCount: manga._count.chapters,
          createdAt: manga.createdAt.toISOString(),
          updatedAt: manga.updatedAt.toISOString(),
          highlights: query ? extractHighlights(
            {
              title: manga.title,
              description: manga.description,
              authorName: manga.authorName,
              tags: manga.tags,
            },
            query
          ) : null,
        }));

        return {
          mangas: transformedResults, // Also provide as 'mangas' for backward compatibility
          results: transformedResults,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNextPage,
            nextCursor,
          },
          meta: {
            query,
            filters: {
              genres,
              status: validatedStatus,
              author,
              minRating,
              maxRating,
              tags,
            },
            sort,
          },
        };
      }
    );

    // Add cache headers
    const headers = new Headers();
    headers.set('Cache-Control', query ? 'public, s-maxage=30' : 'public, s-maxage=300, stale-while-revalidate=600');

    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Error in search:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
