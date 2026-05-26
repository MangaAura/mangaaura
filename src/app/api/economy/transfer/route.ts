/**
 * POST /api/economy/transfer
 * Transfer Aura to another user with 3% burn fee
 */

import { NextRequest, NextResponse } from 'next/server';

import { TransferAuraUseCase } from '@/application/use-cases/economy/TransferAuraUseCase';
import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const transferUseCase = new TransferAuraUseCase();

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
      10,
      60,
    );
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
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
    const { toUserId, amount } = body as { toUserId: string; amount: number };

    if (!toUserId || toUserId.trim().length === 0) {
      return NextResponse.json(
        { error: 'ID de destinatario requerido' },
        { status: 400 },
      );
    }

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Monto requerido' },
        { status: 400 },
      );
    }

    const result = await transferUseCase.execute({
      fromUserId: session.user.id,
      toUserId: toUserId.trim(),
      amount,
    });

    return NextResponse.json({
      success: true,
      transferId: result.transferId,
      burnedAmount: result.burnedAmount,
      netAmount: result.netAmount,
      newBalance: result.newBalance,
      transferQuotaRemaining: result.transferQuotaRemaining,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const code = (error as { code?: string }).code || 'INTERNAL_ERROR';

    if (code === 'VALIDATION_ERROR') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (code === 'USER_NOT_FOUND' || code === 'RECIPIENT_NOT_FOUND') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (code === 'INSUFFICIENT_BALANCE' || code === 'INSUFFICIENT_TRANSFER_QUOTA') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (code === 'TRANSFER_LOCKED') {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error('[Transfer] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}