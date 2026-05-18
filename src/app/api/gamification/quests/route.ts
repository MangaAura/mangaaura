/**
 * Quests API - Gamification quests endpoints
 *
 * GET  /api/gamification/quests - Get all active daily + weekly quests with progress
 * POST /api/gamification/quests - Report progress on an action
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getQuestService } from '@/core/services/QuestService';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// GET /api/gamification/quests - Obtener misiones activas con progreso
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
      getRateLimitKey('gamification-quests', identifier),
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const service = getQuestService();
    const dailyPeriod = service.getDailyPeriod();
    const weeklyPeriod = service.getWeeklyPeriod();

    // Fetch existing quest records for current periods
    const existingQuests = await prisma.userQuest.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { periodStart: dailyPeriod.start },
          { periodStart: weeklyPeriod.start },
        ],
      },
      select: {
        id: true,
        questId: true,
        progress: true,
        target: true,
        completed: true,
        completedAt: true,
        claimed: true,
        claimedAt: true,
        periodStart: true,
        periodEnd: true,
      },
    });

    const activeQuests = service.getActiveQuests(
      session.user.id,
      existingQuests,
      user.readingStreak,
    );

    const rewards = service.getTotalPossibleRewards();

    return NextResponse.json({
      quests: activeQuests,
      todayXP: activeQuests
        .filter((q) => q.completed && q.claimed && q.category === 'DAILY')
        .reduce((sum, q) => sum + q.xpReward, 0),
      weekXP: activeQuests
        .filter((q) => q.completed && q.claimed && q.category === 'WEEKLY')
        .reduce((sum, q) => sum + q.xpReward, 0),
      dailyCompletions: activeQuests.filter(
        (q) => q.category === 'DAILY' && (q.completed || q.claimed),
      ).length,
      dailyTotal: dailyPeriod.end,
      weeklyTotal: weeklyPeriod.end,
      totalDailyXP: rewards.dailyXP,
      totalWeeklyXP: rewards.weeklyXP,
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

const progressSchema = {
  actionType: ['POST_COMMENT', 'LIKE_COMMENTS', 'COMPLETE_MANGA'],
  amount: 1,
};

// POST /api/gamification/quests - Reportar progreso en una misión
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
      getRateLimitKey('gamification-quests', identifier),
      20,
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

    const body = await request.json();
    const { actionType, amount = 1 } = body as {
      actionType: string;
      amount?: number;
    };

    if (
      !progressSchema.actionType.includes(actionType as typeof progressSchema.actionType[number])
    ) {
      return NextResponse.json(
        { error: 'Tipo de acción no válido', validTypes: progressSchema.actionType },
        { status: 400 },
      );
    }

    if (amount < 1 || amount > 100) {
      return NextResponse.json(
        { error: 'Cantidad no válida (1-100)' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        readingStreak: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const service = getQuestService();
    const dailyPeriod = service.getDailyPeriod();
    const weeklyPeriod = service.getWeeklyPeriod();

    // Fetch existing quests
    const existingQuests = await prisma.userQuest.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { periodStart: dailyPeriod.start },
          { periodStart: weeklyPeriod.start },
        ],
      },
      select: {
        id: true,
        questId: true,
        progress: true,
        target: true,
        completed: true,
        completedAt: true,
        claimed: true,
        claimedAt: true,
        periodStart: true,
        periodEnd: true,
      },
    });

    // Get current active quests state
    let activeQuests = service.getActiveQuests(
      session.user.id,
      existingQuests,
      user.readingStreak,
    );

    // Report progress
    const { updatedQuests, newlyCompleted } = service.reportProgress(
      activeQuests,
      actionType as 'POST_COMMENT' | 'LIKE_COMMENTS' | 'COMPLETE_MANGA',
      amount,
    );

    activeQuests = updatedQuests;

    // Update or create quest records in DB
    const upserts: Promise<unknown>[] = [];

    for (const quest of activeQuests) {
      const period =
        quest.category === 'DAILY' ? dailyPeriod : weeklyPeriod;

      // Only upsert quests that have progress or were completed
      if (quest.progress > 0 || quest.completed) {
        upserts.push(
          prisma.userQuest.upsert({
            where: {
              userId_questId_periodStart: {
                userId: session.user.id,
                questId: quest.questId,
                periodStart: period.start,
              },
            },
            update: {
              progress: quest.progress,
              completed: quest.completed,
              completedAt: quest.completed ? new Date() : undefined,
            },
            create: {
              userId: session.user.id,
              questId: quest.questId,
              progress: quest.progress,
              target: quest.target,
              completed: quest.completed,
              completedAt: quest.completed ? new Date() : null,
              claimed: quest.claimed,
              periodStart: period.start,
              periodEnd: period.end,
            },
          }),
        );
      }
    }

    await Promise.all(upserts);

    // Auto-claim and award XP for newly completed quests
    let xpAwarded = 0;
    let inkcoinsAwarded = 0;

    for (const completed of newlyCompleted) {
      const questDef = service.getQuestDefinition(completed.questId);
      if (!questDef) continue;

      xpAwarded += questDef.xpReward;
      inkcoinsAwarded += questDef.inkcoinsReward;

      // Mark as claimed
      const period =
        completed.category === 'DAILY' ? dailyPeriod : weeklyPeriod;

      await prisma.userQuest.updateMany({
        where: {
          userId: session.user.id,
          questId: completed.questId,
          periodStart: period.start,
        },
        data: {
          claimed: true,
          claimedAt: new Date(),
        },
      });
    }

    // Award XP and InkCoins
    if (xpAwarded > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xpPoints: { increment: xpAwarded },
          inkcoinsBalance: { increment: inkcoinsAwarded },
        },
      });
    }

    return NextResponse.json({
      success: true,
      quests: activeQuests,
      newlyCompleted: newlyCompleted.map((q) => ({
        questId: q.questId,
        label: q.label,
        xpReward: q.xpReward,
        inkcoinsReward: q.inkcoinsReward,
      })),
      xpAwarded,
      inkcoinsAwarded,
    });
  } catch (error) {
    console.error('Error reporting quest progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
