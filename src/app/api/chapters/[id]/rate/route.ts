import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ rating: null });
    }

    const { id } = await params;

    const progress = await prisma.readingProgress.findFirst({
      where: {
        chapterId: id,
        userId: session.user.id,
        rating: { not: null },
      },
      select: { rating: true },
    });

    return NextResponse.json({ rating: progress?.rating ?? null });
  } catch (error) {
    console.error('[Chapter Rate API GET]', error);
    return NextResponse.json({ rating: null }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const rating = Number(body.rating);

    if (isNaN(rating) || rating < 0.5 || rating > 5) {
      return NextResponse.json({ error: 'Rating debe ser entre 0.5 y 5' }, { status: 400 });
    }

    // Verify chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { id: true, mangaId: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Capítulo no encontrado' }, { status: 404 });
    }

    // Upsert rating without affecting reading progress fields
    await prisma.readingProgress.upsert({
      where: {
        userId_mangaId_chapterId: {
          userId: session.user.id,
          mangaId: chapter.mangaId,
          chapterId: id,
        },
      },
      create: {
        userId: session.user.id,
        mangaId: chapter.mangaId,
        chapterId: id,
        currentPage: 0,
        rating,
      },
      update: {
        rating,
      },
    });

    return NextResponse.json({ rating });
  } catch (error) {
    console.error('[Chapter Rate API]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
