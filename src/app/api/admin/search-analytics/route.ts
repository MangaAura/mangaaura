import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalSearches, uniqueUsers, recentSearches, topQueries] = await Promise.all([
      prisma.userSearch.count(),
      prisma.userSearch.groupBy({
        by: ['userId'],
        _count: { id: true },
      }),
      prisma.userSearch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, query: true, createdAt: true,
          user: { select: { id: true, username: true } },
        },
      }),
      prisma.userSearch.groupBy({
        by: ['query'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySearches = await prisma.userSearch.count({
      where: { createdAt: { gte: todayStart } },
    });

    const searchesByDay = await prisma.userSearch.groupBy({
      by: ['createdAt'],
      _count: { id: true },
    });

    const searchesLast30Days: { date: string; count: number }[] = [];
    const dayMap = new Map<string, number>();
    for (const s of searchesByDay) {
      const d = s.createdAt.toISOString().slice(0, 10);
      dayMap.set(d, (dayMap.get(d) || 0) + s._count.id);
    }
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      searchesLast30Days.push({ date: d, count: dayMap.get(d) || 0 });
    }

    return NextResponse.json({
      totalSearches,
      uniqueUsers: uniqueUsers.length,
      todaySearches,
      topQueries: topQueries.map((q) => ({
        query: q.query,
        count: q._count.id,
      })),
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        query: s.query,
        createdAt: s.createdAt.toISOString(),
        user: s.user,
      })),
      searchesLast30Days,
    });
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
