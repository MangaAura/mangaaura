import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TRASH_EXPIRY_DAYS = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Auto-cleanup: permanently delete mangas that have been in trash > 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - TRASH_EXPIRY_DAYS);

    const expiredMangas = await prisma.mangaSeries.findMany({
      where: {
        authorId: session.user.id,
        deletedAt: { not: null, lte: expiryDate },
      },
      select: { id: true },
    });

    if (expiredMangas.length > 0) {
      const expiredIds = expiredMangas.map((m) => m.id);
      await prisma.$transaction([
        prisma.chapter.deleteMany({ where: { mangaId: { in: expiredIds } } }),
        prisma.mangaSeries.deleteMany({ where: { id: { in: expiredIds } } }),
      ]);
    }

    const where = {
      authorId: session.user.id,
      deletedAt: { not: null },
    };

    const [mangas, total] = await Promise.all([
      prisma.mangaSeries.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          status: true,
          tags: true,
          totalViews: true,
          deletedAt: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.mangaSeries.count({ where }),
    ]);

    const mangasWithStats = mangas.map((manga) => {
      const daysLeft = manga.deletedAt
        ? Math.max(0, TRASH_EXPIRY_DAYS - Math.floor((Date.now() - manga.deletedAt.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        coverUrl: manga.coverUrl,
        status: manga.status,
        tags: manga.tags ? JSON.parse(manga.tags) : [],
        totalViews: manga.totalViews,
        deletedAt: manga.deletedAt,
        daysLeft,
        createdAt: manga.createdAt,
      };
    });

    return NextResponse.json({
      mangas: mangasWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo papelera:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
