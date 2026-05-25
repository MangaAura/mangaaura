import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const crowdfundSchema = z.object({
  amount: z.number().int().min(1),
});

// POST /api/chapters/[id]/crowdfund - Contribuir al crowdfunding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session?.user?.id || 'anonymous';
    const { allowed } = await rateLimit(getRateLimitKey('crowdfund', userId), 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id: chapterId } = await params;
    const body = await request.json();
    const result = crowdfundSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { amount } = result.data;

    // Verificar capítulo existe
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: { select: { authorId: true, title: true } },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que tiene meta de crowdfunding
    if (!chapter.crowdfundingGoal) {
      return NextResponse.json(
        { error: 'Este capítulo no tiene crowdfunding activo' },
        { status: 400 }
      );
    }

    // Verificar que no está ya crowdfunded
    if (chapter.isCrowdfunded) {
      return NextResponse.json(
        { error: 'Este capítulo ya está completamente financiado' },
        { status: 400 }
      );
    }

    // Verificar fondos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { auraBalance: true },
    });

    if (!user || user.auraBalance < amount) {
      return NextResponse.json(
        { error: 'Fondos insuficientes', balance: user?.auraBalance || 0 },
        { status: 400 }
      );
    }

    // Verificar que no es el autor
    if (chapter.manga.authorId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes financiar tu propio capítulo' },
        { status: 400 }
      );
    }

    // Ejecutar contribución
    const [updatedChapter, updatedUser] = await prisma.$transaction([
      prisma.chapter.update({
        where: { id: chapterId },
        data: {
          crowdfundingCurrent: { increment: amount },
          isCrowdfunded: {
            set: chapter.crowdfundingCurrent + amount >= (chapter.crowdfundingGoal || 0),
          },
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { auraBalance: { decrement: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          amount: -amount,
          type: 'CROWDFUND_CONTRIBUTE',
          referenceId: chapterId,
          description: `Crowdfunding: ${chapter.manga.title} Cap. ${chapter.chapterNumber}`,
        },
      }),
    ]);

    const isComplete = updatedChapter.isCrowdfunded;
    const remaining = (chapter.crowdfundingGoal || 0) - updatedChapter.crowdfundingCurrent;

    // Notificar si se alcanzo la meta
    if (isComplete && !chapter.isCrowdfunded) {
      try {
        const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
        const emailQueue = getEmailQueue();

        // Obtener el autor del manga
        const manga = await prisma.mangaSeries.findUnique({
          where: { id: chapter.mangaId },
          include: { author: { select: { id: true, email: true, username: true } } },
        });

        if (manga?.author) {
          await emailQueue.addCrowdfundingGoalEmail({
            to: manga.author.email,
            userId: manga.author.id,
            username: manga.author.username,
            mangaId: manga.id,
            mangaTitle: manga.title,
            mangaSlug: manga.slug,
            chapterId: chapter.id,
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.title || undefined,
                });
              }
      } catch (emailError) {
        console.error('[Crowdfund] Error queueing goal reached email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      contribution: {
        amount,
        chapterId,
      },
      newBalance: updatedUser.auraBalance,
      progress: {
        current: updatedChapter.crowdfundingCurrent,
        goal: chapter.crowdfundingGoal,
        percentage: Math.round(
          (updatedChapter.crowdfundingCurrent / (chapter.crowdfundingGoal || 1)) * 100
        ),
        remaining: Math.max(0, remaining),
        isComplete,
      },
      message: isComplete
        ? '¡Meta alcanzada! El capítulo será publicado pronto.'
        : `Contribución registrada. Faltan ${remaining} Aura.`,
    });
  } catch (error) {
    console.error('Error en crowdfunding:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/chapters/[id]/crowdfund - Ver estado del crowdfunding
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        chapterNumber: true,
        crowdfundingGoal: true,
        crowdfundingCurrent: true,
        isCrowdfunded: true,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    if (!chapter.crowdfundingGoal) {
      return NextResponse.json({
        hasCrowdfunding: false,
      });
    }

    const percentage = Math.round(
      (chapter.crowdfundingCurrent / chapter.crowdfundingGoal) * 100
    );

    return NextResponse.json({
      hasCrowdfunding: true,
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      goal: chapter.crowdfundingGoal,
      current: chapter.crowdfundingCurrent,
      percentage,
      remaining: Math.max(0, chapter.crowdfundingGoal - chapter.crowdfundingCurrent),
      isComplete: chapter.isCrowdfunded,
      contributors: 0, // Podríamos contar transacciones
    });
  } catch (error) {
    console.error('Error obteniendo crowdfunding:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
