import { Award } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AffiliateDashboardClient } from './AffiliateDashboardClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.economyAffiliate.title');
  const description = t('page.economyAffiliate.description');

  return {
    title,
    description,
  };
}

async function getAffiliateData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      affiliateStatus: true,
      affiliateTierId: true,
      affiliateSince: true,
      affiliateTotalEarned: true,
      affiliatePromoCode: true,
      referralCode: true,
      affiliatePayoutMethod: true,
    },
  });

  if (!user || user.affiliateStatus !== 'active') {
    return null;
  }

  // Get tier details
  let tier = null;
  let nextTier = null;
  if (user.affiliateTierId) {
    tier = await prisma.affiliateTier.findUnique({
      where: { id: user.affiliateTierId },
    });
    if (tier) {
      nextTier = await prisma.affiliateTier.findFirst({
        where: { priority: { gt: tier.priority } },
        orderBy: { priority: 'asc' },
      });
    }
  }

  // Get referral stats
  const affiliateReferrals = await prisma.affiliateReferral.findMany({
    where: { affiliateId: userId },
    orderBy: { clickedAt: 'desc' },
    take: 100,
  });

  const totalClicks = affiliateReferrals.length;
  const conversions = affiliateReferrals.filter(r => r.convertedAt !== null).length;
  const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

  // Get commission stats
  const commissions = await prisma.affiliateCommission.findMany({
    where: { affiliateId: userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);

  // Monthly earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyEarnings = commissions
    .filter(c => (c.status === 'pending' || c.status === 'paid') && c.createdAt >= startOfMonth)
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    status: user.affiliateStatus,
    since: user.affiliateSince?.toISOString() || null,
    referralCode: user.referralCode,
    promoCode: user.affiliatePromoCode,
    totalEarned: user.affiliateTotalEarned,
    payoutMethod: user.affiliatePayoutMethod,
    currentTier: tier ? {
      name: tier.name,
      commissionRate: tier.commissionRate,
      priority: tier.priority,
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
      totalPending,
      totalPaid,
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
    recentCommissions: commissions.slice(0, 20).map(c => ({
      id: c.id,
      amount: c.amount,
      rate: c.rate,
      purchaseAmount: c.purchaseAmount,
      purchaseType: c.purchaseType,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      paidAt: c.paidAt?.toISOString() || null,
    })),
  };
}

export default async function AffiliateDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const data = await getAffiliateData(session.user.id);

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 pb-10">
        <div className="text-center py-12">
          <Award size={48} className="mx-auto mb-4 text-muted" />
          <h2 className="text-xl font-bold mb-2">No eres afiliado aún</h2>
          <p className="text-muted text-sm mb-6">
            Regístrate en el programa de afiliados para empezar a ganar comisiones.
          </p>
          <a
            href="/affiliate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl"
          >
            Ver programa de afiliados
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <AffiliateDashboardClient data={data} />
    </div>
  );
}
