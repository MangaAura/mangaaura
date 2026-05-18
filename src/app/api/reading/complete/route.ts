import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getNotificationService } from '@/core/services/NotificationService';
import { getQuestService } from '@/core/services/QuestService';
import { getStreakService } from '@/core/services/StreakService';
import { XP } from '@/core/value-objects/XP';
import { getEventBus } from '@/infrastructure/queue/LocalEventBus';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const completeSchema = z.object({
  chapterId: z.string().uuid(),
  pagesRead: z.array(z.number().int().min(0)),
  scrollDepth: z.array(z.number().min(0).max(100)),
  durationSeconds: z.number().int().min(0).optional(),
});

// POST /api/reading/complete - Marcar capítulo como completado
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const result = completeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, pagesRead: _pagesRead, scrollDepth: _scrollDepth, durationSeconds = 0 } = result.data;

    // Obtener capítulo y manga
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { manga: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya fue completado (sesión con endedAt)
    const existingCompletion = await prisma.readingSession.findFirst({
      where: {
        userId: session.user.id,
        chapterId: chapterId,
        endedAt: { not: null },
      },
    });

    // Obtener usuario actual (incluyendo campos de streak)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        xpPoints: true,
        level: true,
        readingStreak: true,
        lastReadAt: true,
        streakFreezes: true,
        lastStreakMilestone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Usar StreakService para calcular streak con recompensas
    const streakService = getStreakService();
    const now = new Date();

    // Si ya fue completado, no avanzar streak ni dar XP base
    const streakUpdate = existingCompletion
      ? {
          newStreak: user.readingStreak,
          streakIncreased: false,
          streakBroken: false,
          alreadyReadToday: true,
          bonusXP: 0,
          milestonesTriggered: [],
          freezeUsed: false,
          freezesRemaining: user.streakFreezes,
        }
      : streakService.calculateStreakUpdate(
          user.lastReadAt,
          user.readingStreak,
          user.lastStreakMilestone,
          user.streakFreezes,
          false, // don't auto-use freezes on read
        );

    // XP a ganar: base + bonus de streak + bonus de hitos
    const baseXP = existingCompletion ? 0 : 2;
    const { totalBonusXP, multiplierBonus, milestoneBonus } =
      streakService.calculateSessionBonus(streakUpdate);
    const xpEarned = baseXP + totalBonusXP;
    const currentXP = XP.create(user.xpPoints);
    const newXP = currentXP.add(XP.create(xpEarned));

    // Calcular nuevo lastStreakMilestone
    const newLastMilestone = Math.max(
      user.lastStreakMilestone,
      streakService.getHighestMilestoneReached(streakUpdate.newStreak),
    );

    // Actualizar usuario con streak rewards
    // Solo actualizar streak/lastReadAt para nuevas lecturas (no re-lecturas)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xpPoints: newXP.amount,
        level: newXP.level,
        ...(existingCompletion
          ? {}
          : {
              readingStreak: streakUpdate.newStreak,
              lastReadAt: now,
              streakFreezes: streakUpdate.freezesRemaining,
              lastStreakMilestone: newLastMilestone,
            }),
      },
    });

  // Crear registro de lectura
  await prisma.readingSession.create({
    data: {
      userId: session.user.id,
      chapterId: chapterId,
      durationSeconds: durationSeconds,
      endedAt: now,
    },
  });

    // Actualizar UserManga
    await prisma.userManga.upsert({
      where: {
        userId_mangaId: {
          userId: session.user.id,
          mangaId: chapter.mangaId,
        },
      },
      update: {
        status: 'READING',
        progress: Math.max(chapter.chapterNumber, 0),
      },
      create: {
        userId: session.user.id,
        mangaId: chapter.mangaId,
        status: 'READING',
        progress: chapter.chapterNumber,
      },
    });

    // Notificar subida de nivel si aplica
    if (newXP.level > user.level) {
      try {
        await (await getNotificationService()).notifyLevelUp(
          session.user.id,
          user.level,
          newXP.level
        );
      } catch (notifyError) {
        console.error('Error sending level up notification:', notifyError);
      }
    }

    // Notificar hitos de streak alcanzados
    if (streakUpdate.milestonesTriggered.length > 0) {
      try {
        const ns = await getNotificationService();
        for (const milestone of streakUpdate.milestonesTriggered) {
          await ns.createNotification({
            userId: session.user.id,
            type: 'STREAK_MILESTONE',
            title: milestone.label,
            message: `¡Ganaste ${milestone.xpBonus} XP${milestone.freezesAwarded > 0 ? ` y ${milestone.freezesAwarded} freeze(s)` : ''}!` ,
            data: {
              days: milestone.days,
              xpBonus: milestone.xpBonus,
              freezesAwarded: milestone.freezesAwarded,
            },
            linkUrl: '/achievements',
          });
        }
      } catch (notifyError) {
        console.error('Error sending streak milestone notification:', notifyError);
      }
    }

    // Emitir evento con datos de streak
    const eventBus = getEventBus();
    await eventBus.publish({
      id: randomUUID(),
      type: 'CHAPTER_COMPLETED',
      payload: {
        userId: session.user.id,
        chapterId: chapterId,
        mangaId: chapter.mangaId,
        xpEarned: xpEarned,
        baseXP,
        streakBonusXP: totalBonusXP,
        multiplierBonus,
        milestoneBonus,
        newStreak: streakUpdate.newStreak,
        streakIncreased: streakUpdate.streakIncreased,
        streakBroken: streakUpdate.streakBroken,
        milestonesTriggered: streakUpdate.milestonesTriggered.map((m) => m.badgeId),
        durationSeconds: durationSeconds,
      },
      occurredAt: now,
    });

    // Reportar progreso de misiones (asíncrono, no bloquea respuesta)
    if (!existingCompletion) {
      const questService = getQuestService();
      const questPeriods = {
        daily: questService.getDailyPeriod(),
        weekly: questService.getWeeklyPeriod(),
      };

      setTimeout(() => {
        void (async () => {
        try {
          // Fetch existing quests for current periods
          const existingQuests = await prisma.userQuest.findMany({
            where: {
              userId: session.user.id,
              OR: [
                { periodStart: questPeriods.daily.start },
                { periodStart: questPeriods.weekly.start },
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

          // Get active quests with current streak
          let activeQuests = questService.getActiveQuests(
            session.user.id,
            existingQuests,
            streakUpdate.newStreak,
          );

          // Report READ_CHAPTERS progress
          const { updatedQuests, newlyCompleted } = questService.reportProgress(
            activeQuests,
            'READ_CHAPTERS',
            1,
          );

          // Report STREAK_MAINTAIN progress (only if streak increased or is non-zero)
          let withStreakProgress = updatedQuests;
          if (streakUpdate.newStreak > 0) {
            const streakResult = questService.reportStreakProgress(
              withStreakProgress,
              streakUpdate.newStreak,
            );
            withStreakProgress = streakResult.updatedQuests;
            newlyCompleted.push(...streakResult.newlyCompleted);
          }

          activeQuests = withStreakProgress;

          // Upsert quest progress records
          const upserts: Promise<unknown>[] = [];
          for (const quest of activeQuests) {
            const period =
              quest.category === 'DAILY' ? questPeriods.daily : questPeriods.weekly;
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
          let questXpAwarded = 0;
          let questInkcoinsAwarded = 0;

          for (const completed of newlyCompleted) {
            const questDef = questService.getQuestDefinition(completed.questId);
            if (!questDef) continue;

            questXpAwarded += questDef.xpReward;
            questInkcoinsAwarded += questDef.inkcoinsReward;

            const period =
              completed.category === 'DAILY' ? questPeriods.daily : questPeriods.weekly;

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

          if (questXpAwarded > 0) {
            const questNewXP = newXP.add(XP.create(questXpAwarded));
            await prisma.user.update({
              where: { id: session.user.id },
              data: {
                xpPoints: questNewXP.amount,
                level: questNewXP.level,
                inkcoinsBalance: { increment: questInkcoinsAwarded },
              },
            });
          }
        } catch (questError) {
          console.error('[ChapterComplete] Error reporting quest progress:', questError);
        }
      })();
    });
    }

    // Auto-check de logros tras completar capítulo (asíncrono, no bloquea respuesta)
    import('@/core/services/AchievementService').then(({ achievementService }) => {
      achievementService?.checkAchievements(session.user.id).catch(err =>
        console.error('[ChapterComplete] Error checking achievements:', err)
      );
    }).catch(err => console.error('[Reading] Achievement check failed:', err));

    return NextResponse.json({
      success: true,
      chapterCompleted: true,
      xpEarned: xpEarned,
      baseXP,
      streakBonusXP: totalBonusXP,
      multiplierBonus,
      milestoneBonus,
      totalXP: newXP.amount,
      oldLevel: user.level,
      newLevel: newXP.level,
      levelUp: newXP.level > user.level,
      rank: newXP.rank,
      readingStreak: streakUpdate.newStreak,
      streakIncreased: streakUpdate.streakIncreased,
      streakBroken: streakUpdate.streakBroken,
      milestonesTriggered: streakUpdate.milestonesTriggered.map((m) => ({
        days: m.days,
        label: m.label,
        xpBonus: m.xpBonus,
        freezesAwarded: m.freezesAwarded,
      })),
      alreadyReadToday: streakUpdate.alreadyReadToday,
      progressToNextLevel: newXP.progressToNextLevel,
      alreadyCompleted: !!existingCompletion,
    });
  } catch (error) {
    console.error('Error completando capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
