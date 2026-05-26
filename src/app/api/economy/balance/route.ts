/**
 * GET /api/economy/balance
 * Get user's Aura balance and transfer quota
 */

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        auraBalance: true,
        auraLifetimePurchased: true,
        auraLifetimeTransferred: true,
        auraLifetimeWithdrawn: true,
        auraFirstPurchaseAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const transferQuota =
      user.auraLifetimePurchased -
      user.auraLifetimeTransferred -
      user.auraLifetimeWithdrawn;

    return NextResponse.json({
      auraBalance: user.auraBalance,
      auraLifetimePurchased: user.auraLifetimePurchased,
      transferQuotaAvailable: Math.max(0, transferQuota),
      transferQuotaUsed: user.auraLifetimeTransferred,
      auraLifetimeWithdrawn: user.auraLifetimeWithdrawn,
      canTransfer: user.auraLifetimePurchased > 0,
      firstPurchaseAt: user.auraFirstPurchaseAt,
    });
  } catch (error) {
    console.error('[Economy Balance] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}