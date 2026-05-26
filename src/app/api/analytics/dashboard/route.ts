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
  const mangaIdsParam = searchParams.get('mangaIds');
  const dateFrom = searchParams.get('from');
  const dateTo = searchParams.get('to');

  const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = dateTo ? new Date(dateTo) : new Date();

  const dateWhere = {
    createdAt: { gte: fromDate, lte: toDate },
  };

  let authorizedMangaIds: string[] = [];

  if (mangaIdParam) {
    const manga = await prisma.mangaSeries.findFirst({
      where: { id: mangaIdParam, authorId: session.user.id },
      select: { id: true },
    });
    if (manga) authorizedMangaIds = [manga.id];
  } else if (mangaIdsParam) {
    const mangaIds = mangaIdsParam.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (mangaIds.length > 0) {
      const userMangas = await prisma.mangaSeries.findMany({
        where: { id: { in: mangaIds }, authorId: session.user.id },
        select: { id: true },
      });
      authorizedMangaIds = userMangas.map((m: any) => m.id);
    } else {
      const userMangas = await prisma.mangaSeries.findMany({
        where: { authorId: session.user.id },
        select: { id: true },
      });
      authorizedMangaIds = userMangas.map((m: any) => m.id);
    }
  } else {
    const userMangas = await prisma.mangaSeries.findMany({
      where: { authorId: session.user.id },
      select: { id: true },
    });
    authorizedMangaIds = userMangas.map((m: any) => m.id);
  }

  const popularChapterWhere = authorizedMangaIds.length > 0
    ? { mangaId: { in: authorizedMangaIds } }
    : { manga: { authorId: session.user.id } };

  const readingSessionWhere = authorizedMangaIds.length > 0
    ? { chapter: { mangaId: { in: authorizedMangaIds } }, endedAt: { not: null } }
    : { endedAt: { not: null } };

    const [
      views,
      reads,
      completions,
      timeSpent,
      dailyViews,
      dailyReads,
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
        _avg: {
          durationSeconds: true,
        },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: { ...dateWhere, eventType: 'page_view' },
        _count: { id: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: { ...dateWhere, eventType: 'chapter_read' },
        _count: { id: true },
      }),
      prisma.chapter.findMany({
        where: popularChapterWhere,
        orderBy: { viewCount: 'desc' },
        take: 10,
        include: {
          manga: {
            select: { title: true },
          },
        },
      }),
    ]);

  type DailyStat = { createdAt: Date; _count: { id: number } | null };

  const readsByDate = new Map(
    (dailyReads as DailyStat[]).map((stat) => [
      new Date(stat.createdAt).toISOString().split('T')[0],
      stat._count!.id,
    ])
  );

  const formattedDaily = (dailyViews as DailyStat[]).slice(0, 30).map((stat) => {
    const date = new Date(stat.createdAt).toISOString().split('T')[0];
    return {
      date,
      views: stat._count!.id,
      reads: readsByDate.get(date) || 0,
    };
  });

    const completionRate = reads > 0 ? (completions / reads) * 100 : 0;

    return NextResponse.json({
      views,
      reads,
      completions,
      completionRate: Math.round(completionRate * 10) / 10,
      avgTimeSpent: timeSpent._avg.durationSeconds ? Math.round(timeSpent._avg.durationSeconds) : 0,
      dailyStats: formattedDaily,
      popularChapters: popularChapters.map((ch: any) => ({
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
