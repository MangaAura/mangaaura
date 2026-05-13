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
    const mangaIds = searchParams.getAll('mangaIds');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!mangaIds || mangaIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mangaId' },
        { status: 400 }
      );
    }

    const userMangas = await prisma.mangaSeries.findMany({
      where: {
        id: { in: mangaIds },
        authorId: session.user.id,
      },
      select: { id: true },
    });

    const authorizedIds = userMangas.map((m: any) => m.id);
    const unauthorizedIds = mangaIds.filter((id) => !authorizedIds.includes(id));

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver analytics de algunos mangas' },
        { status: 403 }
      );
    }

    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    const whereBase = {
      mangaId: { in: authorizedIds },
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    const [views, reads, completions, timeResult] = await Promise.all([
      prisma.analyticsEvent.count({
where: { ...whereBase, eventType: 'page_view' },
}),
prisma.analyticsEvent.count({
where: { ...whereBase, eventType: 'chapter_read' },
}),
prisma.analyticsEvent.count({
where: { ...whereBase, eventType: 'chapter_complete' },
      }),
      prisma.readingSession.aggregate({
        where: {
          chapter: { mangaId: { in: authorizedIds } },
          endedAt: { not: null },
        },
        _avg: { durationSeconds: true },
      }),
    ]);

    const completionRate = reads > 0 ? (completions / reads) * 100 : 0;

  const chapters = await prisma.chapter.findMany({
    where: { mangaId: { in: authorizedIds } },
    select: { id: true, mangaId: true, chapterNumber: true, title: true },
  });

    const chapterIds = chapters.map((ch: any) => ch.id);

const chapterReads = await prisma.analyticsEvent.groupBy({
by: ['chapterId' as any],
where: {
...whereBase,
eventType: 'chapter_read',
},
_count: { id: true },
} as any);

const chapterCompletions = await prisma.analyticsEvent.groupBy({
by: ['chapterId' as any],
where: {
...whereBase,
eventType: 'chapter_complete',
},
_count: { id: true },
} as any);

    const readsMap = new Map(
      (chapterReads as any[]).map((r: any) => [r.chapterId, r._count.id])
    );
    const completionsMap = new Map(
      (chapterCompletions as any[]).map((r: any) => [r.chapterId, r._count.id])
    );

  const chapterStats = chapters.map((ch: any) => {
    const chReads = readsMap.get(ch.id) || 0;
    const chCompletions = completionsMap.get(ch.id) || 0;
    return {
      chapterId: ch.id,
      mangaId: ch.mangaId,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      reads: chReads,
      completions: chCompletions,
      completionRate: chReads > 0 ? Math.round((chCompletions / chReads) * 1000) / 10 : 0,
    };
  });

    return NextResponse.json({
      totalViews: views,
      totalReads: reads,
      totalCompletions: completions,
      completionRate: Math.round(completionRate * 10) / 10,
      avgTimeSeconds: Math.round(timeResult._avg.durationSeconds || 0),
      chapterStats,
    });
  } catch (error) {
    console.error('[Analytics Creator API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator analytics' },
      { status: 500 }
    );
  }
}
