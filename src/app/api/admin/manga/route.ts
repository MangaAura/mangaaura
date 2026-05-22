import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { syncGenresFromTags } from '@/lib/genres';
import { invalidateCache } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// GET /api/admin/manga - Get all mangas for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const where: { OR?: { title?: { contains: string }; authorName?: { contains: string } }[]; status?: string } = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { authorName: { contains: search } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [mangas, total] = await Promise.all([
      prisma.mangaSeries.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              userMangas: true,
            },
          },
        },
      }),
      prisma.mangaSeries.count({ where }),
    ]);

    // Get comment counts separately for each manga
    const mangaIds = mangas.map((m: any) => m.id);
    const commentCounts = await prisma.comment.groupBy({
      by: ['chapterId'],
      _count: {
        id: true,
      },
    });

    // Get chapter IDs for each manga
    const chapters = await prisma.chapter.findMany({
      where: { mangaId: { in: mangaIds } },
      select: { id: true, mangaId: true },
    });

    const chapterToMangaMap = new Map(chapters.map((c: any) => [c.id, c.mangaId]));
    const mangaCommentCounts = new Map<string, number>();

commentCounts.forEach((cc: any) => {
  const mangaId = chapterToMangaMap.get(cc.chapterId);
  if (mangaId) {
    mangaCommentCounts.set(mangaId, (mangaCommentCounts.get(mangaId) || 0) + cc._count.id);
  }
});

    const formattedMangas = mangas.map((manga: any) => ({
      id: manga.id,
      title: manga.title,
      slug: manga.slug,
      description: manga.description,
      coverUrl: manga.coverUrl,
      status: manga.status,
      tags: manga.tags ? JSON.parse(manga.tags) : [],
      totalViews: manga.totalViews,
      rating: manga.rating,
      authorId: manga.authorId,
      authorName: manga.authorName,
      author: manga.author,
      chapterCount: manga._count.chapters,
      bookmarkCount: manga._count.userMangas,
      commentCount: mangaCommentCounts.get(manga.id) || 0,
      createdAt: manga.createdAt.toISOString(),
      updatedAt: manga.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      mangas: formattedMangas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching mangas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/manga - Create manga as admin
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session?.user?.id || 'anonymous';
    const { allowed } = await rateLimit(getRateLimitKey('admin-manga', userId), 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { title, description, coverUrl, tags, authorId, status } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.mangaSeries.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get author info
    let authorName = 'Unknown';
    let finalAuthorId = authorId;

    if (finalAuthorId) {
      const author = await prisma.user.findUnique({
        where: { id: finalAuthorId },
        select: { displayName: true, username: true },
      });
      authorName = author?.displayName || author?.username || 'Unknown';
    } else {
      finalAuthorId = session.user.id;
      authorName = session.user.name || 'Admin';
    }

    const processedTags = tags && Array.isArray(tags) ? tags.map((t: string) => t.toLowerCase().trim()) : [];

    // Sync genres from tags — auto-create any new genres in the DB
    await syncGenresFromTags(processedTags);

    // Invalidate genres list cache since new genres may have been added
    await invalidateCache('genres:list');

    const manga = await prisma.mangaSeries.create({
      data: {
        title: title.trim(),
        slug,
        description: description || null,
        coverUrl: coverUrl || null,
        authorId: finalAuthorId,
        authorName,
        status: status || 'ONGOING',
        tags: JSON.stringify(processedTags),
      },
    });

    return NextResponse.json({
      message: 'Manga created successfully',
      manga: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        description: manga.description,
        coverUrl: manga.coverUrl,
        status: manga.status,
        tags: manga.tags ? JSON.parse(manga.tags) : [],
        authorId: manga.authorId,
        authorName: manga.authorName,
        createdAt: manga.createdAt.toISOString(),
        updatedAt: manga.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating manga:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
