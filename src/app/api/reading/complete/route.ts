import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { XP } from '@/core/value-objects/XP';
import { getEventBus } from '@/infrastructure/queue/LocalEventBus';
import { notificationService } from '@/core/services/NotificationService';
import { z } from 'zod';

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

    const body = await request.json();
    const result = completeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, pagesRead, scrollDepth, durationSeconds = 0 } = result.data;

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

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        xpPoints: true,
        level: true,
        readingStreak: true,
        lastReadAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Calcular streak
    let newStreak = user.readingStreak;
    const now = new Date();

    if (user.lastReadAt) {
      const lastRead = new Date(user.lastReadAt);
      const today = new Date(now);
      lastRead.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak++;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // XP a ganar (solo si no estaba completado)
    const xpEarned = existingCompletion ? 0 : 2;
    const currentXP = XP.create(user.xpPoints);
    const newXP = currentXP.add(XP.create(xpEarned));

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        xpPoints: newXP.amount,
        level: newXP.level,
        readingStreak: newStreak,
        lastReadAt: now,
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
        await notificationService.notifyLevelUp(
          session.user.id,
          user.level,
          newXP.level
        );
      } catch (notifyError) {
        console.error('Error sending level up notification:', notifyError);
      }
    }

    // Emitir evento
    const eventBus = getEventBus();
    await eventBus.publish({
      id: crypto.randomUUID(),
      type: 'CHAPTER_COMPLETED',
      payload: {
        userId: session.user.id,
        chapterId: chapterId,
        mangaId: chapter.mangaId,
        xpEarned: xpEarned,
        newStreak: newStreak,
        durationSeconds: durationSeconds,
      },
      occurredAt: now,
    });

    // Auto-check de logros tras completar capítulo (asíncrono, no bloquea respuesta)
    import('@/core/services/AchievementService').then(({ achievementService }) => {
      achievementService.checkAchievements(session.user.id).catch(err =>
        console.error('[ChapterComplete] Error checking achievements:', err)
      );
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      chapterCompleted: true,
      xpEarned: xpEarned,
      totalXP: newXP.amount,
      oldLevel: user.level,
      newLevel: newXP.level,
      levelUp: newXP.level > user.level,
      rank: newXP.rank,
      readingStreak: newStreak,
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
