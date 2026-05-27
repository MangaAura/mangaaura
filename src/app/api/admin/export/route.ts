import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'users';
    const format = searchParams.get('format') || 'json';

    let data: Record<string, unknown>[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (entity) {
      case 'users': {
        const users = await prisma.user.findMany({
          select: {
            id: true, username: true, email: true, displayName: true,
            role: true, level: true, xpPoints: true, auraBalance: true,
            readingStreak: true, emailVerified: true, kycStatus: true,
            createdAt: true, lastReadAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        data = users.map((u: any) => ({
          ...u,
          isVerified: !!u.emailVerified,
          isActive: u.role !== 'BANNED',
          createdAt: u.createdAt.toISOString(),
          lastReadAt: u.lastReadAt?.toISOString() || null,
        }));
        break;
      }
      case 'mangas': {
        const mangas = await prisma.mangaSeries.findMany({
          select: {
            id: true, title: true, slug: true, status: true,
            authorName: true, rating: true, totalViews: true,
            tags: true, createdAt: true,
            _count: { select: { chapters: true, libraryEntries: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = mangas.map((m: any) => ({
          ...m,
          tags: (() => { try { return JSON.parse(m.tags as string); } catch { return []; } })(),
          createdAt: m.createdAt.toISOString(),
          chaptersCount: m._count.chapters,
          libraryCount: m._count.libraryEntries,
        }));
        break;
      }
      case 'chapters': {
        const chapters = await prisma.chapter.findMany({
          select: {
            id: true, chapterNumber: true, title: true, status: true,
            viewCount: true, mangaId: true, createdAt: true,
            manga: { select: { title: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        data = chapters.map((c: any) => ({
          id: c.id, chapterNumber: c.chapterNumber, title: c.title,
          status: c.status, views: c.viewCount,
          mangaId: c.mangaId, mangaTitle: c.manga.title,
          createdAt: c.createdAt.toISOString(),
        }));
        break;
      }
      case 'comments': {
        const comments = await prisma.comment.findMany({
          select: {
            id: true, content: true, isHidden: true, isDeleted: true,
            chapterId: true, userId: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        data = comments.map((c: any) => ({
          ...c, createdAt: c.createdAt.toISOString(),
        }));
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return new NextResponse('No data', { status: 200, headers: { 'Content-Type': 'text/csv' } });
      }
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((h) => {
            const val = (row as Record<string, unknown>)[h];
            const str = val == null ? '' : String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(',')
        ),
      ];
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${entity}-${timestamp}.csv"`,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': `attachment; filename="${entity}-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
