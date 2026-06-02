import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // Verify manga exists
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!manga) {
      return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    }

    // Upsert user's manga rating
    await prisma.userManga.upsert({
      where: {
        userId_mangaId: { userId: session.user.id, mangaId: id },
      },
      create: {
        userId: session.user.id,
        mangaId: id,
        rating,
        status: 'PLANNED',
      },
      update: {
        rating,
      },
    });

    // Recalculate average rating for the manga
    const aggregate = await prisma.userManga.aggregate({
      where: { mangaId: id, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : null;

    // Update manga's average rating
    await prisma.mangaSeries.update({
      where: { id },
      data: { rating: averageRating },
    });

    return NextResponse.json({
      rating,
      averageRating,
      totalRatings: aggregate._count.rating,
    });
  } catch (error) {
    console.error('[Manga Rate API]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
