import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { XP } from '@/core/value-objects/XP';

function parseCondition(conditionStr: string): { type: string; count?: number; level?: number } | null {
  try {
    return JSON.parse(conditionStr);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const [achievements, userAchievements, userStats] = await Promise.all([
      prisma.achievementDefinition.findMany({
        orderBy: { xpReward: 'asc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId: session.user.id },
      }),
      getUserStats(session.user.id),
    ]);

    const unlockedIds = new Set(
      userAchievements.map((ua: { achievementId: string }) => ua.achievementId)
    );

    const achievementsWithProgress = achievements.map((ach) => {
      const unlocked = unlockedIds.has(ach.id);
      const condition = parseCondition(ach.condition);
      let progress = 0;
      let target = 1;

      if (condition && userStats) {
        switch (condition.type) {
          case 'CHAPTERS_READ':
            target = condition.count || 1;
            progress = Math.min(userStats.chaptersRead, target);
            break;
          case 'COMMENTS_POSTED':
            target = condition.count || 1;
            progress = Math.min(userStats.commentsPosted, target);
            break;
          case 'CORRECTIONS_APPROVED':
            target = condition.count || 1;
            progress = Math.min(userStats.correctionsApproved, target);
            break;
          case 'MANGAS_COMPLETED':
            target = condition.count || 1;
            progress = Math.min(userStats.mangasCompleted, target);
            break;
          case 'COMMENT_LIKES_RECEIVED':
            target = condition.count || 1;
            progress = Math.min(userStats.commentLikesReceived, target);
            break;
          case 'MANGAS_CREATED':
            target = condition.count || 1;
            progress = Math.min(userStats.mangasCreated, target);
            break;
          case 'SPONSORSHIPS_WON':
            target = condition.count || 1;
            progress = Math.min(userStats.sponsorshipsWon, target);
            break;
          case 'LEVEL_REACHED':
            target = condition.level || 1;
            progress = Math.min(userStats.currentLevel, target);
            break;
          default:
            target = condition.count || 1;
            progress = 0;
        }
      }

      const unlockedAt = unlocked
        ? userAchievements.find((ua) => ua.achievementId === ach.id)?.unlockedAt
        : undefined;

      return {
        id: ach.id,
        badgeId: ach.badgeId,
        name: ach.name,
        description: ach.description,
        iconUrl: ach.iconUrl,
        xpReward: ach.xpReward,
        category: ach.category,
        difficulty: ach.difficulty,
        condition,
        unlocked,
        unlockedAt: unlockedAt?.toISOString(),
        progress,
        target,
        percentage: target > 0 ? Math.round((progress / target) * 100) : 0,
      };
    });

    const achievementXpMap = new Map(
      achievements.map((ach) => [ach.id, ach.xpReward])
    );

    const stats = {
      total: achievements.length,
      unlocked: userAchievements.length,
      totalXPEarned: userAchievements.reduce(
        (sum, ua) => sum + (achievementXpMap.get(ua.achievementId) || 0),
        0
      ),
      completionPercentage: achievements.length > 0
        ? Math.round((userAchievements.length / achievements.length) * 100)
        : 0,
    };

    return NextResponse.json({
      achievements: achievementsWithProgress,
      stats,
    });
  } catch (error) {
    console.error('Error obteniendo logros:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { badgeId } = body;

    if (!badgeId) {
      return NextResponse.json(
        { error: 'badgeId requerido' },
        { status: 400 }
      );
    }

    const achievement = await prisma.achievementDefinition.findUnique({
      where: { badgeId },
    });

    if (!achievement) {
      return NextResponse.json(
        { error: 'Logro no encontrado' },
        { status: 404 }
      );
    }

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: session.user.id,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Logro ya desbloqueado' },
        { status: 409 }
      );
    }

    const [, updatedUser, transaction] = await prisma.$transaction([
      prisma.userAchievement.create({
        data: {
          userId: session.user.id,
          achievementId: achievement.id,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          xpPoints: { increment: achievement.xpReward },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          amount: achievement.xpReward,
          type: 'ACHIEVEMENT_UNLOCKED',
          description: `Logro desbloqueado: ${achievement.name}`,
        },
      }),
    ]);

    const finalUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xpPoints: true, level: true },
    });

    const xp = XP.create(finalUser?.xpPoints || 0);
    const previousLevel = (finalUser?.level || 1) - (xp.level > (updatedUser.level || 1) ? 1 : 0);

    return NextResponse.json({
      success: true,
      achievement: {
        id: achievement.id,
        badgeId: achievement.badgeId,
        name: achievement.name,
        xpReward: achievement.xpReward,
      },
      xpEarned: achievement.xpReward,
      newLevel: xp.level,
      levelUp: xp.level > previousLevel,
    });
  } catch (error) {
    console.error('Error desbloqueando logro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function getUserStats(userId: string): Promise<{
  chaptersRead: number;
  commentsPosted: number;
  correctionsApproved: number;
  mangasCompleted: number;
  commentLikesReceived: number;
  mangasCreated: number;
  sponsorshipsWon: number;
  currentLevel: number;
} | null> {
  try {
    const [
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      user,
    ] = await Promise.all([
      prisma.readingSession.count({ where: { userId, endedAt: { not: null } } }),
      prisma.comment.count({ where: { userId } }),
      prisma.chapterCorrection.count({ where: { userId, status: 'APPROVED' } }),
      prisma.userManga.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.commentLike.count({ where: { comment: { userId } } }),
      prisma.mangaSeries.count({ where: { authorId: userId } }),
      prisma.sponsorshipBid.count({ where: { userId, isWinning: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { level: true } }),
    ]);

    return {
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      currentLevel: user?.level || 1,
    };
  } catch {
    return null;
  }
}