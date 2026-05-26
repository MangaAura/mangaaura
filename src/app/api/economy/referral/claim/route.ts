/**
 * POST /api/economy/referral/claim
 * Claim referral bonus for a referee's first purchase
 */

import { NextRequest, NextResponse } from 'next/server';

import { ClaimReferralBonusUseCase } from '@/application/use-cases/economy/ClaimReferralBonusUseCase';
import { auth } from '@/lib/auth';

const claimUseCase = new ClaimReferralBonusUseCase();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { refereeId } = body as { refereeId: string };

    if (!refereeId || refereeId.trim().length === 0) {
      return NextResponse.json(
        { error: 'ID del usuario referido requerido' },
        { status: 400 },
      );
    }

    const result = await claimUseCase.execute({
      referrerId: session.user.id,
      refereeId: refereeId.trim(),
    });

    return NextResponse.json({
      success: true,
      bonusAmount: result.bonusAmount,
      newBalance: result.newBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const code = (error as { code?: string }).code || 'INTERNAL_ERROR';

    if (code === 'VALIDATION_ERROR') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (code === 'CLAIM_NOT_FOUND') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (code === 'ALREADY_CLAIMED' || code === 'NOT_UNLOCKED' || code === 'REFERRER_NOT_PURCHASED') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (code === 'NO_BONUS') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('[Referral Claim] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}