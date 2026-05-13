import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!mangaId) {
      return NextResponse.json({ error: 'mangaId is required' }, { status: 400 });
    }

    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, title: true, authorId: true },
    });

    if (!manga) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }

    const chapters = await prisma.chapter.findMany({
      where: { mangaId },
      orderBy: { chapterNumber: 'asc' },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        viewCount: true,
        crowdfundingGoal: true,
        crowdfundingCurrent: true,
        isCrowdfunded: true,
      },
    });

    const totalViews = chapters.reduce((sum: number, ch: any) => sum + ch.viewCount, 0);

    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        mangaId,
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
      },
      orderBy: { date: 'asc' },
      take: 30,
    });

    return NextResponse.json({
      manga: { id: manga.id, title: manga.title },
      totalViews,
      totalChapters: chapters.length,
      chapters,
      dailyStats: dailyStats.map((s: any) => ({
        date: s.date.toISOString().split('T')[0],
        views: s.views,
        reads: s.reads,
        completions: s.completions,
      })),
    });
  } catch (error) {
    console.error('[Analytics Manga GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
