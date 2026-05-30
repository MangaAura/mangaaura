import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const mangaId = searchParams.get('mangaId') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'chapterNumber';
    const order = searchParams.get('order') || 'asc';

    const where: Record<string, unknown> = {};
    if (mangaId) where.mangaId = mangaId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { manga: { title: { contains: search } } },
      ];
    }

    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          manga: { select: { id: true, title: true, slug: true, coverUrl: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.chapter.count({ where }),
    ]);

    const formatted = chapters.map((ch) => ({
      id: ch.id,
      mangaId: ch.mangaId,
      manga: ch.manga,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      totalPages: ch.totalPages,
      viewCount: ch.viewCount,
      status: ch.status,
      isCrowdfunded: ch.isCrowdfunded,
      crowdfundingGoal: ch.crowdfundingGoal,
      crowdfundingCurrent: ch.crowdfundingCurrent,
      scheduledAt: ch.scheduledAt?.toISOString() || null,
      commentCount: ch._count.comments,
      createdAt: ch.createdAt.toISOString(),
      updatedAt: ch.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      chapters: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mangaId, chapterNumber, title, totalPages, pageUrls, coverUrl, status, scheduledAt } = body;

    if (!mangaId || chapterNumber === undefined) {
      return NextResponse.json({ error: 'mangaId and chapterNumber are required' }, { status: 400 });
    }

    const manga = await prisma.mangaSeries.findUnique({ where: { id: mangaId } });
    if (!manga) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }

    const existing = await prisma.chapter.findUnique({
      where: { mangaId_chapterNumber: { mangaId, chapterNumber } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Chapter number already exists for this manga' }, { status: 409 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        mangaId,
        chapterNumber,
        title: title || null,
        totalPages: totalPages || 0,
        pageUrls: pageUrls ? JSON.stringify(pageUrls) : '[]',
        coverUrl: coverUrl || null,
        status: status || 'PUBLISHED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json({ chapter, message: 'Chapter created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 });
    }

    await prisma.$transaction(
      orders.map((item: { id: string; chapterNumber: number }, index: number) =>
        prisma.chapter.update({
          where: { id: item.id },
          data: { chapterNumber: item.chapterNumber ?? index + 1 },
        })
      )
    );

    return NextResponse.json({ message: 'Chapters reordered successfully' });
  } catch (error) {
    console.error('Error reordering chapters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
