import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/core/services/PaymentService';
import { SendTipUseCase } from '@/application/use-cases/economy/SendTipUseCase';
import { z } from 'zod';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const tipSchema = z.object({
  chapterId: z.string().uuid(),
  amount: z.number().int().min(5).max(1000),
  message: z.string().max(200).optional(),
});

const sendTipUseCase = new SendTipUseCase(paymentService);

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

    const identifier = session.user.id;
    const { allowed } = await rateLimit(
      getRateLimitKey('tip', identifier),
      20,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
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

    const tipResult = await sendTipUseCase.execute({
      senderId: session.user.id,
      chapterId,
      amount,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'Propina enviada exitosamente',
      tip: tipResult.tip,
      newBalance: tipResult.newBalance,
    });
  } catch (error) {
    console.error('Error enviando propina:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
