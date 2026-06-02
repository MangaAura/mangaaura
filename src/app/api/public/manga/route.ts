import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimit(
      getRateLimitKey('public-manga', ip),
      30,
      60
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sort = searchParams.get('sort') || 'updated';
    const genre = searchParams.get('genre') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const orderBy: Record<string, 'asc' | 'desc'> =
      sort === 'popular' ? { totalViews: 'desc' as const }
        : sort === 'rating' ? { rating: 'desc' as const }
        : sort === 'created' ? { createdAt: 'desc' as const }
        : { updatedAt: 'desc' as const };

    const where: Record<string, unknown> = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (genre) {
      where.mangaGenres = { some: { genre: { slug: genre } } };
    }

    const [mangas, total] = await Promise.all([
      prisma.mangaSeries.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverUrl: true,
          authorName: true,
          status: true,
          tags: true,
          totalViews: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { chapters: true } },
        },
      }),
      prisma.mangaSeries.count({ where }),
    ]);

    return NextResponse.json({
      data: mangas.map((m) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        description: m.description,
        coverUrl: m.coverUrl,
        authorName: m.authorName,
        status: m.status,
        tags: m.tags ? m.tags.split(',').filter(Boolean) : [],
        totalViews: m.totalViews,
        rating: m.rating,
        totalChapters: m._count.chapters,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in public manga API:', error);
    return NextResponse.json(
      { error: 'Error al obtener mangas' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
