import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { Users } from 'lucide-react';
import { ReferralsClient } from './ReferralsClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.economyReferrals.title');
  const description = t('page.economyReferrals.description');

  return {
    title,
    description,
  };
}

async function getReferralStats(userId: string) {
  const claims = await prisma.referralClaim.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: 'desc' },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      auraLifetimePurchased: true,
    },
  });

  return {
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
    canClaim: (user?.auraLifetimePurchased || 0) > 0,
    referrals: claims.map((c) => ({
      refereeId: c.refereeId,
      status: c.status,
      purchaseAmount: c.purchaseAmount,
      bonusAwarded: c.bonusAwarded,
      createdAt: c.createdAt.toISOString(),
      unlockedAt: c.unlockedAt?.toISOString() || null,
      claimedAt: c.claimedAt?.toISOString() || null,
    })),
  };
}

export default async function ReferralsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 pb-10">
        <div className="text-center py-12 text-muted">
          Inicia sesión para ver tu programa de referencias
        </div>
      </div>
    );
  }

  const stats = await getReferralStats(session.user.id);

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Users className="text-[var(--primary)]" size={24} /> Programa de Referencias
        </h1>
        <p className="text-muted text-sm">Invita amigos y gana 10% de su primera compra</p>
      </div>

      <ReferralsClient stats={stats} />
    </div>
  );
}