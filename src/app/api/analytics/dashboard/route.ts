/**
 * Analytics Dashboard API
 * 
 * Retorna estadísticas para el dashboard del creador.
 */

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
    const mangaId = searchParams.get('mangaId');
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    // Construir where clause
    const where: any = {
      timestamp: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (mangaId) {
      where.mangaId = mangaId;
    } else {
      // Si no hay mangaId, filtrar por mangas del usuario
      const userMangas = await prisma.mangaSeries.findMany({
        where: { authorId: session.user.id },
        select: { id: true },
      });
      where.mangaId = { in: userMangas.map(m => m.id) };
    }

    // Obtener estadísticas
    const [
      views,
      reads,
      completions,
      timeSpent,
      dailyStats,
      popularChapters,
    ] = await Promise.all([
      // Total views
      prisma.analyticsEvent.count({
        where: { ...where, type: 'page_view' },
      }),

      // Total reads
      prisma.analyticsEvent.count({
        where: { ...where, type: 'chapter_read' },
      }),

      // Total completions
      prisma.analyticsEvent.count({
        where: { ...where, type: 'chapter_complete' },
      }),

    // Average time spent (usando ReadingSession)
    mangaId
      ? prisma.readingSession.aggregate({
          where: {
            chapter: { mangaId },
            endedAt: { not: null },
          },
          _avg: {
            durationSeconds: true,
          },
        })
      : prisma.readingSession.aggregate({
          where: {
            userId: session.user.id,
            endedAt: { not: null },
          },
          _avg: {
            durationSeconds: true,
          },
        }),

      // Daily stats (simplificado)
      prisma.analyticsEvent.groupBy({
        by: ['timestamp'],
        where,
        _count: {
          id: true,
        },
      }),

      // Popular chapters
      prisma.chapter.findMany({
        where: mangaId ? { mangaId } : {
          manga: { authorId: session.user.id }
        },
        orderBy: { viewCount: 'desc' },
        take: 10,
        include: {
          manga: {
            select: { title: true },
          },
        },
      }),
    ]);

    // Formatear daily stats
    const formattedDaily = dailyStats.slice(0, 30).map((stat: any) => ({
      date: stat.timestamp.toISOString().split('T')[0],
      views: stat._count.id,
      reads: Math.floor(stat._count.id * 0.6), // Estimado
    }));

    // Calcular completion rate
    const completionRate = reads > 0 ? (completions / reads) * 100 : 0;

    return NextResponse.json({
      views,
      reads,
      completions,
      completionRate: Math.round(completionRate * 10) / 10,
      avgTimeSpent: 240, // Segundos - mock
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
