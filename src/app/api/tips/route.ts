import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/core/services/PaymentService';
import { z } from 'zod';

const sendTipSchema = z.object({
  chapterId: z.string().uuid(),
  amount: z.number().int().min(1).max(10000),
  message: z.string().max(500).optional(),
});

// POST /api/tips - Enviar propina
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
    const result = sendTipSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, amount, message } = result.data;

    const result_tip = await paymentService.sendTip({
      chapterId,
      fromUserId: session.user.id,
      amount,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'Propina enviada exitosamente',
      tip: result_tip.tip,
      newBalance: result_tip.newBalance,
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

// GET /api/tips - Obtener propinas del usuario (enviadas o recibidas)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'received' | 'given'
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let tips;
    if (type === 'given') {
      tips = await paymentService.getUserTipsGiven(session.user.id, limit);
    } else {
      tips = await paymentService.getUserTipsReceived(session.user.id, limit);
    }

    return NextResponse.json({ tips });
  } catch (error) {
    console.error('Error obteniendo propinas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
