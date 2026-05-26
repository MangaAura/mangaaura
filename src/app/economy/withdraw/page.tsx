import { Wallet } from 'lucide-react';
import type { Metadata } from 'next';

import { WithdrawClient } from './WithdrawClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Retirar Aura | MangaAura',
  description: 'Retira tu Aura a una cuenta bancaria',
};

async function getWithdrawInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      auraBalance: true,
      auraFirstPurchaseAt: true,
      kycStatus: true,
      kycVerifiedAt: true,
    },
  });

  if (!user) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const canWithdraw =
    user.kycStatus === 'approved' &&
    user.auraFirstPurchaseAt !== null &&
    user.auraFirstPurchaseAt <= thirtyDaysAgo;

  return {
    auraBalance: user.auraBalance,
    auraFirstPurchaseAt: user.auraFirstPurchaseAt?.toISOString() || null,
    kycStatus: user.kycStatus,
    canWithdraw,
  };
}

export default async function WithdrawPage() {
  const session = await auth();

  let withdrawInfo = null;
  if (session?.user?.id) {
    withdrawInfo = await getWithdrawInfo(session.user.id);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Wallet className="text-[var(--primary)]" size={24} /> Retirar Aura
        </h1>
        <p className="text-muted text-sm">Retira Aura a tu cuenta bancaria. Mínimo 1,000 Aura, comisión 30%.</p>
      </div>

      <WithdrawClient withdrawInfo={withdrawInfo} />
    </div>
  );
}