import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { XP } from '@/core/value-objects/XP';
import { z } from 'zod';

const tipSchema = z.object({
  chapterId: z.string().uuid(),
  amount: z.number().int().min(5).max(1000),
  message: z.string().max(200).optional(),
});

// POST /api/economy/tip - Enviar propina a autor
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
    const result = tipSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, amount, message } = result.data;

    // Obtener usuario y verificar fondos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, inkcoinsBalance: true, username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.inkcoinsBalance < amount) {
      return NextResponse.json(
        { error: 'Fondos insuficientes', balance: user.inkcoinsBalance },
        { status: 400 }
      );
    }

    // Obtener capítulo y autor
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { manga: { select: { authorId: true, authorName: true, title: true } } },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // No puede darse propina a sí mismo
    if (chapter.manga.authorId === user.id) {
      return NextResponse.json(
        { error: 'No puedes darte propina a ti mismo' },
        { status: 400 }
      );
    }

    // Ejecutar transaccion
    const [, , newUser] = await prisma.$transaction([
      // Restar al emisor
      prisma.user.update({
        where: { id: user.id },
        data: { inkcoinsBalance: { decrement: amount } },
      }),
      // Sumar al receptor
      prisma.user.update({
        where: { id: chapter.manga.authorId },
        data: { inkcoinsBalance: { increment: amount } },
      }),
      // Registrar transaccion
      prisma.transaction.create({
        data: {
          userId: user.id,
          amount: -amount,
          type: 'TIP_SENT',
          referenceId: chapterId,
          description: `Propina a ${chapter.manga.authorName}`,
        },
      }),
    ]);

    // Notificar al receptor por email (asincrono)
    try {
      const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
      const emailQueue = getEmailQueue();

      const tipRecord = await prisma.transaction.findFirst({
        where: { userId: user.id, type: 'TIP_SENT', referenceId: chapterId },
        orderBy: { timestamp: 'desc' },
      });

      await emailQueue.addTipReceivedEmail({
        to: chapter.manga.authorId, // Se resuelve el email en el worker
        userId: chapter.manga.authorId,
        username: chapter.manga.authorName,
        tipId: tipRecord?.id || crypto.randomUUID(),
        amount,
        message: message || undefined,
        fromUserId: user.id,
        fromUsername: user.username,
      });
    } catch (emailError) {
      console.error('[Tip] Error queueing tip notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Propina enviada exitosamente',
      tip: {
        amount,
        chapterId,
        authorId: chapter.manga.authorId,
        message,
      },
      newBalance: user.inkcoinsBalance - amount,
    });
  } catch (error) {
    console.error('Error enviando propina:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
