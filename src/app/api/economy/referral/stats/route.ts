/**
 * GET /api/economy/referral/stats
 * Get referral stats for the current user
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

    const claims = await prisma.referralClaim.findMany({
      where: { referrerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        auraLifetimePurchased: true,
      },
    });

    const stats = {
      referralCode: user?.referralCode || null,
      totalReferrals: claims.length,
      locked: claims.filter((c) => c.status === 'locked').length,
      unlocked: claims.filter((c) => c.status === 'unlocked').length,
      claimed: claims.filter((c) => c.status === 'claimed').length,
      totalEarnedFromReferrals: claims
        .filter((c) => c.status === 'claimed')
        .reduce((sum, c) => sum + c.bonusAwarded, 0),
      pendingBonus: claims
        .filter((c) => c.status === 'unlocked')
        .reduce((sum, c) => sum + c.bonusAwarded, 0),
      canClaim: user?.auraLifetimePurchased ? user.auraLifetimePurchased > 0 : false,
      referrals: claims.map((c) => ({
        refereeId: c.refereeId,
        status: c.status,
        purchaseAmount: c.purchaseAmount,
        bonusAwarded: c.bonusAwarded,
        createdAt: c.createdAt,
        unlockedAt: c.unlockedAt,
        claimedAt: c.claimedAt,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Referral Stats] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}