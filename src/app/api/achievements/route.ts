import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { XP } from '@/core/value-objects/XP';

// GET /api/achievements - Listar logros disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener todos los logros disponibles
    const [achievements, userAchievements, user] = await Promise.all([
      prisma.achievementDefinition.findMany({
        orderBy: { xpReward: 'asc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          xpPoints: true,
          _count: {
            select: {
              transactions: { where: { type: 'CHAPTER_COMPLETE' } },
              // Para contar comentarios necesitaríamos MongoDB
            },
          },
        },
      }),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Calcular progreso para cada logro
    const achievementsWithProgress = achievements.map((ach) => {
      const unlocked = unlockedIds.has(ach.id);
      let progress = 0;
      let total = 1;

      // Calcular progreso según tipo de logro
      if (ach.badgeId === 'first_read') {
        total = 1;
        progress = user ? Math.min(user._count.transactions, 1) : 0;
      } else if (ach.badgeId === 'bibliophile') {
        total = 100;
        progress = user ? Math.min(user._count.transactions, 100) : 0;
      } else if (ach.badgeId === 'streak_7') {
        total = 7;
        // Necesitaríamos contar streak actual
        progress = 0;
      }

      return {
        id: ach.id,
        badgeId: ach.badgeId,
        name: ach.name,
        description: ach.description,
        iconUrl: ach.iconUrl,
        xpReward: ach.xpReward,
        unlocked,
        unlockedAt: unlocked
          ? userAchievements.find((ua) => ua.achievementId === ach.id)?.unlockedAt
          : undefined,
        progress,
        total,
        percentage: Math.round((progress / total) * 100),
      };
    });

    // Create a map of achievementId to xpReward for stats calculation
    const achievementXpMap = new Map(achievements.map((ach) => [ach.id, ach.xpReward]));

    // Estadísticas
    const stats = {
      total: achievements.length,
      unlocked: userAchievements.length,
      totalXPEarned: userAchievements.reduce((sum, ua) => sum + (achievementXpMap.get(ua.achievementId) || 0), 0),
      completionPercentage: Math.round((userAchievements.length / achievements.length) * 100),
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

// POST /api/achievements/unlock - Desbloquear logro (trigger manual o automático)
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

    // Verificar si logro existe
    const achievement = await prisma.achievementDefinition.findUnique({
      where: { badgeId },
    });

    if (!achievement) {
      return NextResponse.json(
        { error: 'Logro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya está desbloqueado
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

    // Desbloquear logro y agregar XP
    const [userAchievement, user] = await prisma.$transaction([
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

    // Recalcular nivel
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xpPoints: true, level: true },
    });

    const xp = XP.create(updatedUser?.xpPoints || 0);

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
      levelUp: xp.level > (user.level || 1),
    });
  } catch (error) {
    console.error('Error desbloqueando logro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
