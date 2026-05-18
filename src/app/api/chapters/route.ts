import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');
    const sort = searchParams.get('sort') || 'chapterNumber';
    const order = searchParams.get('order') || 'asc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!mangaId) {
      return NextResponse.json({ error: 'mangaId is required' }, { status: 400 });
    }

    const where = { mangaId };

    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where,
        orderBy: { [sort]: order === 'desc' ? 'desc' : 'asc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          totalPages: true,
          viewCount: true,
          isCrowdfunded: true,
          crowdfundingGoal: true,
          crowdfundingCurrent: true,
          createdAt: true,
        },
      }),
      prisma.chapter.count({ where }),
    ]);

    return NextResponse.json({
      chapters,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[Chapters GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
