import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// ─── CSV helpers ────────────────────────────────────────────────────

/** Escape a CSV field per RFC 4180 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Fields containing commas, quotes, or newlines must be quoted
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Generate a CSV string with UTF-8 BOM for Excel compatibility */
function toCSV(rows: Record<string, unknown>[], headers?: string[]): string {
  if (!rows.length) return '\uFEFF' + (headers ? headers.join(',') : '');
  const keys = headers ?? Object.keys(rows[0]);
  const headerLine = keys.map(csvEscape).join(',');
  const dataLines = rows.map((row) =>
    keys.map((key) => csvEscape(row[key])).join(',')
  );
  // BOM prefix ensures Excel interprets UTF-8 correctly (e.g. Spanish accents)
  return '\uFEFF' + [headerLine, ...dataLines].join('\n');
}

// ─── Friendly headers per export type ───────────────────────────────

const HEADERS: Record<string, string[]> = {
  reading: [
    'mangaTitle', 'mangaSlug', 'chapterNumber', 'chapterTitle',
    'currentPage', 'totalPages', 'progressPercent', 'completed',
    'startedAt', 'updatedAt',
  ],
  manga: [
    'title', 'slug', 'status', 'totalChapters', 'uniqueReaders',
    'createdAt', 'updatedAt',
  ],
  activity: [
    'type', 'description', 'metadata', 'createdAt',
  ],
};

// ─── POST /api/analytics/export ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const identifier = session.user.id;
    const { allowed } = await rateLimit(
      getRateLimitKey('analytics-export', identifier),
      5,
      3600
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { format = 'csv', type = 'reading', dateRange } = body;

    const userId = session.user.id;

    // Build date filter if dateRange provided
    const dateFilter: Record<string, Date> = {};
    if (dateRange?.from) dateFilter.gte = new Date(dateRange.from);
    if (dateRange?.to) dateFilter.lte = new Date(dateRange.to);

    let data: Record<string, unknown>[] = [];

    switch (type) {
      case 'reading': {
        const whereDate: Record<string, unknown> = {};
        if (Object.keys(dateFilter).length > 0) {
          whereDate.updatedAt = dateFilter;
        }

        const raw = await prisma.readingProgress.findMany({
          where: { userId, ...whereDate },
          include: {
            manga: { select: { title: true, slug: true } },
            chapter: { select: { chapterNumber: true, title: true, totalPages: true } },
          },
          orderBy: { updatedAt: 'desc' },
        });

        data = raw.map((r) => ({
          mangaTitle: r.manga?.title ?? '',
          mangaSlug: r.manga?.slug ?? '',
          chapterNumber: r.chapter?.chapterNumber ?? 0,
          chapterTitle: r.chapter?.title ?? '',
          currentPage: r.currentPage,
          totalPages: r.chapter?.totalPages ?? 0,
          progressPercent: (r.chapter?.totalPages ?? 0) > 0 ? Math.round((r.currentPage / (r.chapter?.totalPages ?? 1)) * 100) : 0,
          completed: r.completed,
          startedAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
        break;
      }

      case 'manga': {
        const whereMangaDate: Record<string, unknown> = {};
        if (Object.keys(dateFilter).length > 0) {
          whereMangaDate.createdAt = dateFilter;
        }

        const raw = await prisma.mangaSeries.findMany({
          where: { authorId: userId, ...whereMangaDate },
          include: {
            _count: { select: { chapters: true } },
            readingProgress: {
              select: { userId: true },
              distinct: ['userId'],
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        data = raw.map((r: any) => ({
          title: r.title,
          slug: r.slug,
          status: r.status,
          totalChapters: r._count?.chapters ?? 0,
          uniqueReaders: r.readingProgress?.length ?? 0,
          createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt ?? ''),
          updatedAt: r.updatedAt?.toISOString?.() ?? String(r.updatedAt ?? ''),
        }));
        break;
      }

      case 'activity': {
        const whereActivityDate: Record<string, unknown> = {};
        if (Object.keys(dateFilter).length > 0) {
          whereActivityDate.createdAt = dateFilter;
        }

        const raw = await prisma.userActivity.findMany({
          where: { userId, ...whereActivityDate },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });

        data = raw.map((r: any) => ({
          type: r.type ?? '',
          description: r.description ?? '',
          metadata: r.metadata ? JSON.stringify(r.metadata) : '',
          createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt ?? ''),
        }));
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Tipo de exportación no válido. Use: reading, manga, activity' },
          { status: 400 }
        );
    }

    // ── Format output ────────────────────────────────────────────

    let output: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      const headers = HEADERS[type] ?? undefined;
      output = toCSV(data, headers);
      contentType = 'text/csv; charset=utf-8';
      filename = `mangaaura-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (format === 'json') {
      output = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      filename = `mangaaura-${type}-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado. Use csv o json' },
        { status: 400 }
      );
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}
