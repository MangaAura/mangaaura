/**
 * Library API
 * 
 * GET: Lista de biblioteca del usuario con filtros
 * POST: Agregar manga a la biblioteca
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCacheKey, getCache, setCache, invalidateUserCache } from '@/lib/cache';
import { z } from 'zod';

const CACHE_TTL = 60;

// Validation schema
const addToLibrarySchema = z.object({
  mangaId: z.string().uuid(),
  status: z.enum(['READING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_READ']).default('READING'),
});

/**
 * GET /api/library
 * Query params:
 * - status: filter by status
 * - sort: recent_update|progress|rating|title
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const sort = searchParams.get('sort') || 'updatedAt';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')));

  // Generate cache key
  const cacheKey = generateCacheKey('library', { userId: session.user.id, status, sort, page, limit });
  
  // Try cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const where = {
      userId: session.user.id,
      ...(status && { status }),
    };

    // Build orderBy based on sort
    const orderBy: any = { updatedAt: 'desc' };
    switch (sort) {
      case 'title':
        orderBy.manga = { title: 'asc' };
        break;
      case 'rating':
        orderBy.rating = 'desc';
        break;
      case 'progress':
        orderBy.currentChapter = 'desc';
        break;
    }

    const [entries, total] = await Promise.all([
      prisma.userLibrary.findMany({
        where,
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverUrl: true,
              status: true,
              authorName: true,
              totalViews: true,
              rating: true,
              chapters: {
                select: { id: true, chapterNumber: true },
                orderBy: { chapterNumber: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userLibrary.count({ where }),
    ]);

    // Enrich with latest chapter info
    const enrichedEntries = entries.map((entry: any) => ({
      id: entry.id,
      mangaId: entry.mangaId,
      status: entry.status,
      currentChapter: entry.currentChapter,
      rating: entry.rating,
      addedAt: entry.addedAt,
      updatedAt: entry.updatedAt,
      manga: entry.manga,
      totalChapters: entry.manga.chapters.length,
      progress: entry.manga.chapters[0] 
        ? Math.round((entry.currentChapter / entry.manga.chapters[0].chapterNumber) * 100)
        : 0,
    }));

    const result = {
      entries: enrichedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };

    // Cache the result
    await setCache(cacheKey, result, CACHE_TTL);

    return Response.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching library:', error);
    return Response.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}

/**
 * POST /api/library
 * Body: { mangaId: string, status?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mangaId, status } = addToLibrarySchema.parse(body);

    // Check if manga exists
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true },
    });

    if (!manga) {
      return Response.json({ error: 'Manga not found' }, { status: 404 });
    }

    // Upsert library entry
    const entry = await prisma.userLibrary.upsert({
      where: {
        userId_mangaId: {
          userId: session.user.id,
          mangaId,
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mangaId,
        status,
      },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
      },
    });

    // Invalidate library cache
    await invalidateUserCache(session.user.id);

    return Response.json(entry, { status: 201 });
  } catch (error) {
if (error instanceof z.ZodError) {
return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Error adding to library:', error);
    return Response.json({ error: 'Failed to add to library' }, { status: 500 });
  }
}
