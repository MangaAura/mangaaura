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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimit(
      getRateLimitKey('public-manga-detail', ip),
      30,
      60
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const { slug } = await params;

    const manga = await prisma.mangaSeries.findUnique({
      where: { slug, deletedAt: null },
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
        authorId: true,
        _count: { select: { chapters: true } },
      },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      data: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        description: manga.description,
        coverUrl: manga.coverUrl,
        authorName: manga.authorName,
        authorId: manga.authorId,
        status: manga.status,
        tags: manga.tags ? manga.tags.split(',').filter(Boolean) : [],
        totalViews: manga.totalViews,
        rating: manga.rating,
        totalChapters: manga._count.chapters,
        createdAt: manga.createdAt.toISOString(),
        updatedAt: manga.updatedAt.toISOString(),
      },
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in public manga detail API:', error);
    return NextResponse.json(
      { error: 'Error al obtener el manga' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
