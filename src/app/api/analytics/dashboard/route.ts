import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { searchParams } = new URL(request.url);
  const mangaIdParam = searchParams.get('mangaId');
  const dateFrom = searchParams.get('from');
  const dateTo = searchParams.get('to');

  const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = dateTo ? new Date(dateTo) : new Date();

  const fromEnd = new Date(toDate);
  fromEnd.setHours(23, 59, 59, 999);

  const fromStart = new Date(fromDate);
  fromStart.setHours(0, 0, 0, 0);

  const dateWhere = {
    createdAt: { gte: fromStart, lte: fromEnd },
  };

  let authorizedMangaIds: string[] = [];

  if (mangaIdParam) {
    const manga = await prisma.mangaSeries.findFirst({
      where: { id: mangaIdParam, authorId: session.user.id },
      select: { id: true },
    });
    if (manga) authorizedMangaIds = [manga.id];
  } else {
    const userMangas = await prisma.mangaSeries.findMany({
      where: { authorId: session.user.id },
      select: { id: true },
    });
    authorizedMangaIds = userMangas.map((m) => m.id);
  }

  const readingSessionWhere = authorizedMangaIds.length > 0
    ? { chapter: { mangaId: { in: authorizedMangaIds } }, endedAt: { not: null } }
    : { endedAt: { not: null } };

    const [
      views,
      reads,
      completions,
      timeSpent,
      allEvents,
      popularChapters,
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { ...dateWhere, eventType: 'page_view' },
      }),
      prisma.analyticsEvent.count({
        where: { ...dateWhere, eventType: 'chapter_read' },
      }),
      prisma.analyticsEvent.count({
        where: { ...dateWhere, eventType: 'chapter_complete' },
      }),
      prisma.readingSession.aggregate({
        where: readingSessionWhere,
        _avg: { durationSeconds: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { ...dateWhere, eventType: { in: ['page_view', 'chapter_read'] } },
        select: { createdAt: true, eventType: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.chapter.findMany({
        where: authorizedMangaIds.length > 0
          ? { mangaId: { in: authorizedMangaIds } }
          : { manga: { authorId: session.user.id } },
        orderBy: { viewCount: 'desc' },
        take: 10,
        include: {
          manga: { select: { title: true } },
        },
      }),
    ]);

  const completionRate = reads > 0 ? (completions / reads) * 100 : 0;

  // Build daily stats from events grouped by date
  const dailyMap = new Map<string, { views: number; reads: number }>();
  for (const ev of allEvents) {
    const dateKey = ev.createdAt.toISOString().split('T')[0];
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { views: 0, reads: 0 });
    }
    const entry = dailyMap.get(dateKey)!;
    if (ev.eventType === 'page_view') entry.views++;
    if (ev.eventType === 'chapter_read') entry.reads++;
  }
  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .slice(-30);

    return NextResponse.json({
      views,
      reads,
      completions,
      completionRate: Math.round(completionRate * 10) / 10,
      avgTimeSpent: timeSpent._avg.durationSeconds ? Math.round(timeSpent._avg.durationSeconds) : 0,
      dailyStats,
      popularChapters: popularChapters.map((ch) => ({
        chapterId: ch.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        views: ch.viewCount,
        mangaTitle: ch.manga.title,
      })),
    });
  } catch (error) {
    console.error('[Analytics Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
