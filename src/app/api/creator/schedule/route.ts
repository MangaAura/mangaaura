/**
 * GET /api/creator/schedule
 *
 * Devuelve todos los capítulos programados (SCHEDULED) y publicados recientemente
 * de los mangas del creador autenticado, para mostrarlos en el calendario editorial.
 *
 * Query params:
 *   - from: ISO date (opcional) — inicio del rango. Default: inicio del mes actual.
 *   - to: ISO date (opcional) — fin del rango. Default: fin del próximo mes.
 *   - status: 'scheduled' | 'published' | 'all' (default: 'all')
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    // Obtener IDs de los mangas del creador
    const mangas = await prisma.mangaSeries.findMany({
      where: { authorId: session.user.id },
      select: { id: true, title: true, slug: true, coverUrl: true },
    });

    // Si se especifica un mangaId, filtrar (usado desde la página de detalle)
    const { searchParams } = new URL(request.url);
    const mangaIdFilter = searchParams.get('mangaId');

    const filteredMangas = mangaIdFilter
      ? mangas.filter(m => m.id === mangaIdFilter || m.slug === mangaIdFilter)
      : mangas;

    const mangaIds = filteredMangas.map(m => m.id);
    if (mangaIds.length === 0) {
      return NextResponse.json({
        schedule: [],
        mangas: [],
        stats: {
          totalScheduled: 0,
          totalPublishedThisMonth: 0,
          nextChapter: null,
        },
      });
    }

    // Parsear parámetros de fechas
    const now = new Date();

    // Por defecto: 2 meses atrás hasta 2 meses adelante
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);

    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : defaultFrom;
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : defaultTo;
    const statusFilter = searchParams.get('status') || 'all';

    // Build where clause
    // Captura:
    // - Capítulos programados con scheduledAt en el rango
    // - Capítulos publicados en el rango (por createdAt)
    // - Capítulos que fueron programados y ahora están publicados (scheduledAt en rango)
    const whereChapters: Record<string, unknown> = {
      mangaId: { in: mangaIds },
      OR: [
        { scheduledAt: { gte: from, lte: to }, status: 'SCHEDULED' },
        { createdAt: { gte: from, lte: to }, status: 'PUBLISHED' },
        { scheduledAt: { gte: from, lte: to }, status: 'PUBLISHED' },
      ],
    };

    if (statusFilter === 'scheduled') {
      whereChapters.OR = [
        { scheduledAt: { gte: from, lte: to }, status: 'SCHEDULED' },
      ];
    } else if (statusFilter === 'published') {
      whereChapters.OR = [
        { createdAt: { gte: from, lte: to }, status: 'PUBLISHED' },
        { scheduledAt: { gte: from, lte: to }, status: 'PUBLISHED' },
      ];
    }

    const chapters = await prisma.chapter.findMany({
      where: whereChapters as any,
      orderBy: [
        { scheduledAt: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        mangaId: true,
      },
    });

    // Armar datos de schedule
    const schedule = chapters.map(ch => {
      const manga = mangas.find(m => m.id === ch.mangaId);
      const displayDate = ch.status === 'SCHEDULED' && ch.scheduledAt
        ? ch.scheduledAt
        : ch.createdAt;

      return {
        id: ch.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title || `Capítulo ${ch.chapterNumber}`,
        status: ch.status as string,
        scheduledAt: ch.scheduledAt?.toISOString() || null,
        createdAt: ch.createdAt.toISOString(),
        displayDate: displayDate.toISOString(),
        mangaId: ch.mangaId,
        mangaTitle: manga?.title || '',
        mangaSlug: manga?.slug || '',
        mangaCoverUrl: manga?.coverUrl || null,
      };
    });

    // Calcular stats
    const nowMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const totalScheduled = chapters.filter(ch =>
      ch.status === 'SCHEDULED' && ch.scheduledAt && ch.scheduledAt >= now
    ).length;

    const totalPublishedThisMonth = chapters.filter(ch =>
      ch.status === 'PUBLISHED' && ch.createdAt >= nowMonthStart && ch.createdAt <= nextMonthEnd
    ).length;

    // Próximo capítulo a publicar
    const nextChapter = schedule
      .filter(ch => ch.status === 'SCHEDULED' && ch.scheduledAt && new Date(ch.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0] || null;

    return NextResponse.json({
      schedule,
      mangas: mangas.map(m => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        coverUrl: m.coverUrl,
      })),
      stats: {
        totalScheduled,
        totalPublishedThisMonth,
        nextChapter,
      },
    });
  } catch (error) {
    console.error('[CreatorSchedule] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
