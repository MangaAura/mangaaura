import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - Get all users for admin
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        xpPoints: true,
        auraBalance: true,
        level: true,
        readingStreak: true,
        createdAt: true,
        lastReadAt: true,
        _count: {
          select: {
            createdMangas: true,
            comments: true,
          },
        },
      },
    });

    const userIds = users.map((u: any) => u.id);

    const [chapterCounts, mangaAuthorMap] = await Promise.all([
      prisma.chapter.groupBy({
        by: ['mangaId'],
        _count: { id: true },
      }),
      prisma.mangaSeries.findMany({
        where: { authorId: { in: userIds } },
        select: { id: true, authorId: true },
      }),
    ]);

    const chapterCountByManga = Object.fromEntries(
      chapterCounts.map((c: any) => [c.mangaId, c._count.id])
    );

    const userChapterCounts = new Map<string, number>();
    for (const manga of mangaAuthorMap) {
      const authorId = manga.authorId;
      const count = chapterCountByManga[manga.id] || 0;
      userChapterCounts.set(authorId, (userChapterCounts.get(authorId) || 0) + count);
    }

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      xpPoints: user.xpPoints,
      auraBalance: user.auraBalance,
      level: user.level,
      readingStreak: user.readingStreak,
      createdAt: user.createdAt.toISOString(),
      lastReadAt: user.lastReadAt?.toISOString() || null,
      mangaCount: user._count.createdMangas,
      chapterCount: userChapterCounts.get(user.id) || 0,
      commentCount: user._count.comments,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
