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

    // Auto-cleanup: permanently delete bundles that have expired
    const now = new Date();
    await prisma.deletedMangaBundle.deleteMany({
      where: {
        authorId: session.user.id,
        expiresAt: { lte: now },
      },
    });

    const where = { authorId: session.user.id };

    // Get bundles (properly deleted manga)
    const [bundles, softDeletedMangas, total] = await Promise.all([
      prisma.deletedMangaBundle.findMany({
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
      prisma.mangaSeries.findMany({
        where: { authorId: session.user.id, deletedAt: { not: null } },
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
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.deletedMangaBundle.count({ where }),
    ]);

    const mangasWithStats = bundles.map((bundle) => {
      const msSinceDeleted = Date.now() - bundle.deletedAt.getTime();
      const daysLeft = Math.max(0, TRASH_EXPIRY_DAYS - Math.floor(msSinceDeleted / (1000 * 60 * 60 * 24)));

      return {
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        coverUrl: bundle.coverUrl,
        status: bundle.status,
        tags: bundle.tags ? JSON.parse(bundle.tags) : [],
        totalViews: bundle.totalViews,
        deletedAt: bundle.deletedAt.toISOString(),
        daysLeft,
        createdAt: bundle.createdAt.toISOString(),
        source: 'bundle' as const,
      };
    });

    // Add soft-deleted manga (deletedAt set but not in bundle)
    const softDeletedWithStats = softDeletedMangas.map((manga) => {
      const msSinceDeleted = Date.now() - manga.deletedAt!.getTime();
      const daysLeft = Math.max(0, TRASH_EXPIRY_DAYS - Math.floor(msSinceDeleted / (1000 * 60 * 60 * 24)));

      return {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        coverUrl: manga.coverUrl,
        status: manga.status,
        tags: manga.tags ? JSON.parse(manga.tags) : [],
        totalViews: manga.totalViews,
        deletedAt: manga.deletedAt!.toISOString(),
        daysLeft,
        createdAt: manga.createdAt.toISOString(),
        source: 'soft' as const,
      };
    });

    // Combine both sources and sort by deletedAt desc
    const allMangas = [...mangasWithStats, ...softDeletedWithStats].sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );

    return NextResponse.json({
      mangas: allMangas,
      pagination: {
        page,
        limit,
        total: total + softDeletedMangas.length,
        totalPages: Math.ceil((total + softDeletedMangas.length) / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo papelera:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
