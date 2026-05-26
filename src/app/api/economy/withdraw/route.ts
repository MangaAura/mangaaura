/**
 * POST /api/economy/withdraw
 * Withdraw Aura to bank account (after KYC verification)
 */

import { NextRequest, NextResponse } from 'next/server';

import { WithdrawAuraUseCase } from '@/application/use-cases/economy/WithdrawAuraUseCase';
import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const withdrawUseCase = new WithdrawAuraUseCase();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session.user.id || ip;
    const rlResult = await rateLimit(
      getRateLimitKey('economy', identifier),
      5,
      86400,
    );
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Máximo 5 retiros por día.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rlResult.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    const body = await request.json();
    const { amount } = body as { amount: number };

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Monto requerido' },
        { status: 400 },
      );
    }

    const result = await withdrawUseCase.execute({
      userId: session.user.id,
      amount,
    });

    return NextResponse.json({
      success: true,
      withdrawalId: result.withdrawalId,
      amount: result.amount,
      fee: result.fee,
      netToUser: result.netToUser,
      newBalance: result.newBalance,
      status: 'processing',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const code = (error as { code?: string }).code || 'INTERNAL_ERROR';

    if (code === 'VALIDATION_ERROR') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (code === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (code === 'KYC_NOT_APPROVED') {
      return NextResponse.json({ error: message, code: 'KYC_REQUIRED' }, { status: 403 });
    }
    if (code === 'THIRTY_DAY_HOLD') {
      return NextResponse.json({ error: message, code: 'HOLD_PERIOD' }, { status: 403 });
    }
    if (code === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (code === 'NO_PURCHASE_HISTORY') {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error('[Withdraw] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}