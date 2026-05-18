/**
 * Streak API - Gamification streak endpoints
 *
 * GET  /api/gamification/streak - Get streak state, calendar data, and next milestone
 * POST /api/gamification/streak - Use a streak freeze to protect the streak
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStreakService } from '@/core/services/StreakService';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// GET /api/gamification/streak - Obtener estado completo del streak
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    const identifier = session.user.id || ip;
    const rlResult = await rateLimit(
      getRateLimitKey('gamification-streak', identifier),
      30,
      60,
    );
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rlResult.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        readingStreak: true,
        lastReadAt: true,
        streakFreezes: true,
        lastStreakMilestone: true,
        xpPoints: true,
        level: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const service = getStreakService();
    const state = service.getStreakState(
      user.readingStreak,
      user.lastReadAt,
      user.streakFreezes,
      user.lastStreakMilestone,
    );

    // Get last 90 days of reading activity for calendar
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const recentSessions = await prisma.readingSession.findMany({
      where: {
        userId: session.user.id,
        endedAt: { gte: ninetyDaysAgo, not: null },
      },
      select: { endedAt: true },
      orderBy: { endedAt: 'asc' },
    });

    // Build calendar: array of dates the user read
    const readingDays = new Set<string>();
    for (const session of recentSessions) {
      if (session.endedAt) {
        const date = new Date(session.endedAt);
        readingDays.add(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        );
      }
    }

    // Get reached milestones
    const reachedMilestones = service.getReachedMilestones(user.readingStreak);

    return NextResponse.json({
      streak: state.streak,
      alreadyReadToday: state.alreadyReadToday,
      freezesAvailable: state.freezesAvailable,
      bonusMultiplier: state.bonusMultiplier,
      nextMilestone: state.nextMilestone,
      daysToNextMilestone: state.daysToNextMilestone,
      reachedMilestones: reachedMilestones.map((m) => ({
        days: m.days,
        label: m.label,
        badgeId: m.badgeId,
      })),
      readingCalendar: Array.from(readingDays).sort(),
      xpPoints: user.xpPoints,
      level: user.level,
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST /api/gamification/streak - Usar un streak freeze
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    const identifier = session.user.id || ip;
    const rlResult = await rateLimit(
      getRateLimitKey('gamification-streak', identifier),
      10,
      60,
    );
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rlResult.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        readingStreak: true,
        lastReadAt: true,
        streakFreezes: true,
        lastStreakMilestone: true,
        xpPoints: true,
        level: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.streakFreezes <= 0) {
      return NextResponse.json(
        { error: 'No tienes freezes disponibles. Mantén tu racha para ganar más.' },
        { status: 400 },
      );
    }

    // Verify that a freeze is actually needed (missed exactly yesterday)
    const service = getStreakService();
    const update = service.calculateStreakUpdate(
      user.lastReadAt,
      user.readingStreak,
      user.lastStreakMilestone,
      user.streakFreezes,
      true, // use freeze
    );

    if (!update.freezeUsed) {
      return NextResponse.json(
        { error: 'No necesitas usar un freeze ahora. ¡Tu racha está activa!' },
        { status: 400 },
      );
    }

    // Apply freeze: update streak and decrement freezes
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        readingStreak: update.newStreak,
        streakFreezes: update.freezesRemaining,
        lastStreakMilestone: Math.max(
          user.lastStreakMilestone,
          service.getHighestMilestoneReached(update.newStreak),
        ),
        lastReadAt: new Date(), // Count today as read (the freeze "fills in" yesterday)
      },
      select: {
        readingStreak: true,
        streakFreezes: true,
        xpPoints: true,
        level: true,
      },
    });

    // Award milestone XP if any were triggered
    if (update.milestonesTriggered.length > 0) {
      const totalBonus = update.milestonesTriggered.reduce(
        (sum, m) => sum + m.xpBonus,
        0,
      );
      await prisma.user.update({
        where: { id: session.user.id },
        data: { xpPoints: { increment: totalBonus } },
      });

      // Queue achievement checks for milestone badges
      try {
        const { achievementService } = await import(
          '@/core/services/AchievementService'
        );
        await achievementService?.checkAchievements(session.user.id);
      } catch (e) {
        console.error('Error checking achievements after freeze:', e);
      }
    }

    return NextResponse.json({
      success: true,
      streak: updatedUser.readingStreak,
      freezesRemaining: updatedUser.streakFreezes,
      milestonesTriggered: update.milestonesTriggered.map((m) => ({
        days: m.days,
        label: m.label,
        xpBonus: m.xpBonus,
      })),
    });
  } catch (error) {
    console.error('Error using streak freeze:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
