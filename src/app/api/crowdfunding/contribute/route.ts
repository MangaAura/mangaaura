import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/infrastructure/adapters/paymentService';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { ContributeCrowdfundingUseCase } from '@/application/use-cases/economy/ContributeCrowdfundingUseCase';
import { z } from 'zod';

const contributeSchema = z.object({
  chapterId: z.string().uuid(),
  amount: z.number().int().min(1).max(100000),
  isAnonymous: z.boolean().optional().default(false),
  message: z.string().max(500).optional(),
});

const contributeUseCase = new ContributeCrowdfundingUseCase(paymentService);

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

    const userId = session?.user?.id || 'anonymous';
    const { allowed } = await rateLimit(getRateLimitKey('contribute', userId), 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

    const contributionResult = await contributeUseCase.execute({
      userId: session.user.id,
      chapterId,
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
    // console.error('Error realizando contribución:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
