import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/core/services/PaymentService';
import { z } from 'zod';

const contributeSchema = z.object({
  chapterId: z.string().uuid(),
  amount: z.number().int().min(1).max(100000),
  isAnonymous: z.boolean().optional().default(false),
  message: z.string().max(500).optional(),
});

// POST /api/crowdfunding/contribute - Contribuir a crowdfunding
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
    const result = contributeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, amount, isAnonymous, message } = result.data;

    const contributionResult = await paymentService.contributeToCrowdfunding({
      chapterId,
      userId: session.user.id,
      amount,
      isAnonymous,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'Contribución realizada exitosamente',
      contribution: contributionResult.contribution,
      newTotal: contributionResult.newTotal,
      goalReached: contributionResult.goalReached,
    });
  } catch (error) {
    console.error('Error realizando contribución:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
