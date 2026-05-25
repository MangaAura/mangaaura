import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const mangaId = searchParams.get('mangaId');
  const chapterId = searchParams.get('chapterId');
  const publicOnly = searchParams.get('public') === 'true';

  const skip = (page - 1) * limit;

  const where: any = {
    userId: session.user.id,
  };

  if (mangaId) {
    where.mangaId = mangaId;
  }

  if (chapterId) {
    where.chapterId = chapterId;
  }

  if (publicOnly) {
    where.isPublic = true;
  }

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    bookmarks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  try {
    const body = await request.json();
    const { mangaId, chapterId, page, note, isPublic } = body;

    if (!mangaId) {
      return NextResponse.json({ error: 'mangaId es requerido' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        mangaId,
        chapterId: chapterId || null,
        page: page || 0,
        note: note || null,
        isPublic: isPublic || false,
      },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
          },
        },
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un marcador para este manga/capítulo' },
        { status: 409 }
      );
    }
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}