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
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || 'all';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { author: { username: { contains: search } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status === 'pinned') where.isPinned = true;
    else if (status === 'locked') where.isLocked = true;

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { posts: true } },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    const formatted = threads.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      content: t.content.substring(0, 200),
      isPinned: t.isPinned,
      isLocked: t.isLocked,
      viewCount: t.viewCount,
      author: t.author,
      category: t.category,
      postCount: t._count.posts,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      threads: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
