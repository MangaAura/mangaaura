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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where: Record<string, unknown> = {};
    if (status === 'hidden') where.isHidden = true;
    else if (status === 'deleted') where.isDeleted = true;
    else if (status === 'visible') { where.isHidden = false; where.isDeleted = false; }

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { displayName: { contains: search } } },
      ];
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          chapter: { select: { id: true, chapterNumber: true, mangaId: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    const chapterIds = comments.map((c) => c.chapterId);
    const chapters = await prisma.chapter.findMany({
      where: { id: { in: chapterIds } },
      select: { id: true, chapterNumber: true, mangaId: true, manga: { select: { id: true, title: true, slug: true } } },
    });
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      isHidden: c.isHidden,
      isDeleted: c.isDeleted,
      hiddenReason: c.hiddenReason,
      likesCount: c.likesCount,
      repliesCount: 0,
      user: c.user,
      chapter: chapterMap.get(c.chapterId),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      comments: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
