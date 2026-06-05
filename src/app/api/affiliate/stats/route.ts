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
        id: true,
        affiliateStatus: true,
        affiliateTierId: true,
        affiliateSince: true,
        affiliateTotalEarned: true,
        referralCode: true,
        affiliatePromoCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Get tier details
    let tier = null;
    if (user.affiliateTierId) {
      tier = await prisma.affiliateTier.findUnique({
        where: { id: user.affiliateTierId },
      });
    }

    // Get referral stats (AffiliateReferral model)
    const affiliateReferrals = await prisma.affiliateReferral.findMany({
      where: { affiliateId: session.user.id },
      orderBy: { clickedAt: 'desc' },
    });

    const totalClicks = affiliateReferrals.length;
    const conversions = affiliateReferrals.filter(r => r.convertedAt !== null).length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Get pending commissions
    const pendingCommissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: session.user.id,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPendingAura = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    // Get paid commissions
    const paidCommissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: session.user.id,
        status: 'paid',
      },
    });

    const totalPaidAura = paidCommissions.reduce((sum, c) => sum + c.amount, 0);

    // Get monthly earnings (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthCommissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: session.user.id,
        status: { in: ['pending', 'paid'] },
        createdAt: { gte: startOfMonth },
      },
    });

    const monthlyEarnings = thisMonthCommissions.reduce((sum, c) => sum + c.amount, 0);

    // Next tier info
    let nextTier = null;
    if (tier) {
      nextTier = await prisma.affiliateTier.findFirst({
        where: { priority: { gt: tier.priority } },
        orderBy: { priority: 'asc' },
      });
    }

    return NextResponse.json({
      status: user.affiliateStatus,
      since: user.affiliateSince?.toISOString() || null,
      referralCode: user.referralCode,
      promoCode: user.affiliatePromoCode,
      totalEarned: user.affiliateTotalEarned,
      currentTier: tier ? {
        id: tier.id,
        name: tier.name,
        commissionRate: tier.commissionRate,
        monthlyPayoutLimit: tier.monthlyPayoutLimit,
      } : null,
      nextTier: nextTier ? {
        name: nextTier.name,
        commissionRate: nextTier.commissionRate,
        minReferrals: nextTier.minReferrals,
        minRevenue: nextTier.minRevenue,
      } : null,
      stats: {
        totalClicks,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalPendingAura,
        totalPaidAura,
        monthlyEarnings,
      },
      recentReferrals: affiliateReferrals.slice(0, 20).map(r => ({
        id: r.id,
        clickedAt: r.clickedAt.toISOString(),
        convertedAt: r.convertedAt?.toISOString() || null,
        firstPurchaseAt: r.firstPurchaseAt?.toISOString() || null,
        totalPurchases: r.totalPurchases,
        totalCommission: r.totalCommission,
        source: r.source,
        campaign: r.campaign,
      })),
    });
  } catch (error) {
    console.error('[Affiliate Stats] Error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
