import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// POST /api/analytics/export - Export analytics data
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
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const body = await request.json();
    const { format = 'csv', type = 'reading' } = body;

    // Only allow users to export their own data or manga they created
    const userId = session.user.id;
    const isCreator = session.user.role === 'CREATOR' || session.user.role === 'ADMIN';

    let data: any[] = [];

    switch (type) {
      case 'reading':
        // Reading history
        data = await prisma.readingProgress.findMany({
          where: { userId },
          include: {
            manga: {
              select: {
                title: true,
                slug: true,
              },
            },
            chapter: {
              select: {
                chapterNumber: true,
                title: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });
        break;

      case 'manga':
        if (!isCreator) {
          return NextResponse.json(
            { error: 'Solo creadores pueden exportar datos de manga' },
            { status: 403 }
          );
        }
        // Manga created by user with stats
        data = await prisma.mangaSeries.findMany({
          where: { authorId: userId },
          include: {
            _count: {
              select: { chapters: true },
            },
            readingProgress: {
              select: {
                userId: true,
              },
              distinct: ['userId'],
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        break;

      case 'activity':
        // User activity log
        data = await prisma.userActivity.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de exportación no válido' },
          { status: 400 }
        );
    }

    // Format data
    let output: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row) => {
        return Object.values(row)
          .map((val) => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
            return String(val);
          })
          .join(',');
      });
      output = [headers, ...rows].join('\n');
      contentType = 'text/csv';
      filename = `inkverse-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (format === 'json') {
      output = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      filename = `inkverse-${type}-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado. Use csv o json' },
        { status: 400 }
      );
    }

    // Create response with file download
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
