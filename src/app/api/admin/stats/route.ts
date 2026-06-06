import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/* Types for stats response are defined inline in the handler */

// Helper to check if user is admin
async function checkAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return ['ADMIN', 'OWNER'].includes(user?.role as string);
}

// GET /api/admin/stats - Get dashboard statistics
export async function GET(_request: NextRequest) {
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
    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const monthBeforeLast = new Date(lastMonthStart);
    monthBeforeLast.setMonth(monthBeforeLast.getMonth() - 1);
    monthBeforeLast.setHours(0, 0, 0, 0);

    // Generate last 7 days array for daily activity
    const dailyLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyLabels.push(d.toISOString().slice(0, 10));
    }
    const dailyStart = new Date(dailyLabels[0]);
    dailyStart.setHours(0, 0, 0, 0);

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
      usersLastMonth,
      usersMonthBefore,
      mangasLastMonth,
      mangasMonthBefore,
      recentUsers,
      recentMangas,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.mangaSeries.count(),
      prisma.chapter.count(),
      prisma.comment.count(),

      // Today's new items
      prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.mangaSeries.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.chapter.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.comment.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),

      // Activity counts (user activities in time ranges)
      prisma.userActivity.count({ where: { createdAt: { gte: last24h } } }),
      prisma.userActivity.count({ where: { createdAt: { gte: last7d } } }),
      prisma.userActivity.count({ where: { createdAt: { gte: last30d } } }),

      // Moderation counts
      prisma.chapterCorrection.count({ where: { status: 'PENDING' } }),
      prisma.comment.count({ where: { OR: [{ isHidden: true }, { hiddenReason: { not: null } }] } }),

      // Popular mangas (top 10 by views)
      prisma.mangaSeries.findMany({
        take: 10,
        orderBy: { totalViews: 'desc' },
        select: {
          id: true, title: true, slug: true, coverUrl: true,
          authorName: true, totalViews: true, rating: true,
          _count: { select: { chapters: true } },
        },
      }),

      // Month-over-month user count
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthBeforeLast, lt: lastMonthStart } } }),
      // Month-over-month manga count
      prisma.mangaSeries.count({ where: { createdAt: { gte: lastMonthStart } } }),
      prisma.mangaSeries.count({ where: { createdAt: { gte: monthBeforeLast, lt: lastMonthStart } } }),

      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, displayName: true, avatarUrl: true, createdAt: true },
      }),
      // Recent mangas (last 5)
      prisma.mangaSeries.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, coverUrl: true, authorName: true, createdAt: true },
      }),
    ]);

    // Daily activity data: sample userActivity grouped by day for last 7 days
    // Daily activity data: query user_activity grouped by day for last 7 days
    // Uses raw SQL for DATE() function which varies by DB
    let activityData = dailyLabels.map((date) => ({ date, users: 0, views: 0 }));
    try {
      const dailyActivityRaw = await prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
        `SELECT DATE(created_at) as day, COUNT(*) as count FROM user_activity WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY day ASC`,
        dailyStart
      );
      const activityMap = new Map(
        (dailyActivityRaw as any[]).map((r: any) => {
          const dayStr = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
          return [dayStr, Number(r.count)];
        })
      );
      activityData = dailyLabels.map((date) => ({
        date,
        users: activityMap.get(date) || 0,
        views: 0, // page views pending real data integration
      }));
    } catch {
      // If raw query fails (column name mismatch), fallback to empty data
      console.warn('Daily activity query failed, using empty data');
    }

    // Get reported content count
    const reportedContent = await prisma.analyticsEvent.count({
      where: { eventType: 'REPORT', createdAt: { gte: last30d } },
    });

    const calcChange = (current: number, previous: number): number | undefined => {
      if (previous === 0) return undefined;
      return Math.round(((current - previous) / previous) * 100);
    };

    const stats = {
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
      changes: {
        users: calcChange(usersLastMonth, usersMonthBefore),
        mangas: calcChange(mangasLastMonth, mangasMonthBefore),
      },
      popularMangas: popularMangas.map((manga: any) => ({
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        coverUrl: manga.coverUrl,
        authorName: manga.authorName,
        totalViews: manga.totalViews,
        rating: manga.rating,
        chapterCount: manga._count.chapters,
      })),
      activityData,
      recentUsers: recentUsers.map((u: any) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
      })),
      recentMangas: recentMangas.map((m: any) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        coverUrl: m.coverUrl,
        authorName: m.authorName,
        createdAt: m.createdAt,
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
