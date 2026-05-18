/**
 * Quest Claim API - Claim a completed quest reward
 *
 * POST /api/gamification/quests/claim - Claim XP + InkCoins for a completed quest
 */

import { NextRequest, NextResponse } from 'next/server';

import { getQuestService } from '@/core/services/QuestService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// POST /api/gamification/quests/claim - Reclamar recompensa de misión completada
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
      getRateLimitKey('gamification-quests-claim', identifier),
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
    const { questId } = body as { questId: string };

    if (!questId) {
      return NextResponse.json(
        { error: 'Se requiere questId' },
        { status: 400 },
      );
    }

    const questDef = getQuestService().getQuestDefinition(questId);
    if (!questDef) {
      return NextResponse.json(
        { error: 'Misión no encontrada' },
        { status: 404 },
      );
    }

    const service = getQuestService();
    const period =
      questDef.category === 'DAILY' ? service.getDailyPeriod() : service.getWeeklyPeriod();

    // Find the quest record
    const userQuest = await prisma.userQuest.findFirst({
      where: {
        userId: session.user.id,
        questId: questId,
        periodStart: period.start,
        completed: true,
        claimed: false,
      },
    });

    if (!userQuest) {
      return NextResponse.json(
        {
          error:
            'Misión no encontrada, no completada, o ya reclamada',
        },
        { status: 400 },
      );
    }

    // Mark as claimed
    await prisma.userQuest.update({
      where: { id: userQuest.id },
      data: {
        claimed: true,
        claimedAt: new Date(),
      },
    });

    // Award XP and InkCoins
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xpPoints: { increment: questDef.xpReward },
        inkcoinsBalance: { increment: questDef.inkcoinsReward },
      },
    });

    return NextResponse.json({
      success: true,
      questId: questDef.questId,
      label: questDef.label,
      xpAwarded: questDef.xpReward,
      inkcoinsAwarded: questDef.inkcoinsReward,
    });
  } catch (error) {
    console.error('Error claiming quest reward:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
