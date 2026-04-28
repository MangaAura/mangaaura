import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Types for stats response
interface DashboardStats {
  counts: {
    totalUsers: number;
    totalMangas: number;
    totalChapters: number;
    totalComments: number;
  };
  activity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  today: {
    newUsers: number;
    newMangas: number;
    newChapters: number;
    newComments: number;
  };
  moderation: {
    pendingCorrections: number;
    flaggedComments: number;
    reportedContent: number;
  };
  popularMangas: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorName: string;
    totalViews: number;
    rating: number | null;
    chapterCount: number;
  }>;
}

// Helper to check if user is admin
async function checkAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    // Calculate time ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all counts in parallel
    const [
      totalUsers,
      totalMangas,
      totalChapters,
      totalComments,
      newUsersToday,
      newMangasToday,
      newChaptersToday,
      newCommentsToday,
      activity24h,
      activity7d,
      activity30d,
      pendingCorrections,
      flaggedComments,
      popularMangas,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.mangaSeries.count(),
      prisma.chapter.count(),
      prisma.comment.count(),

      // Today's new items
      prisma.user.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.mangaSeries.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.chapter.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.comment.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),

      // Activity counts (user activities in time ranges)
      prisma.userActivity.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.userActivity.count({
        where: { createdAt: { gte: last7d } },
      }),
      prisma.userActivity.count({
        where: { createdAt: { gte: last30d } },
      }),

      // Moderation counts
      prisma.chapterCorrection.count({
        where: { status: 'PENDING' },
      }),
      prisma.comment.count({
        where: {
          OR: [
            { isHidden: true },
            { hiddenReason: { not: null } },
          ],
        },
      }),

      // Popular mangas (top 10 by views)
      prisma.mangaSeries.findMany({
        take: 10,
        orderBy: { totalViews: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          authorName: true,
          totalViews: true,
          rating: true,
          _count: {
            select: { chapters: true },
          },
        },
      }),
    ]);

    // Get reported content count from AnalyticsEvent (content reports)
    const reportedContent = await prisma.analyticsEvent.count({
      where: {
        type: 'REPORT',
        timestamp: { gte: last30d },
      },
    });

    const stats: DashboardStats = {
      counts: {
        totalUsers,
        totalMangas,
        totalChapters,
        totalComments,
      },
      activity: {
        last24h: activity24h,
        last7d: activity7d,
        last30d: activity30d,
      },
      today: {
        newUsers: newUsersToday,
        newMangas: newMangasToday,
        newChapters: newChaptersToday,
        newComments: newCommentsToday,
      },
      moderation: {
        pendingCorrections,
        flaggedComments,
        reportedContent,
      },
      popularMangas: popularMangas.map((manga) => ({
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        coverUrl: manga.coverUrl,
        authorName: manga.authorName,
        totalViews: manga.totalViews,
        rating: manga.rating,
        chapterCount: manga._count.chapters,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas del admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
