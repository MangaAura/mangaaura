import { ArrowRightLeft } from 'lucide-react';
import { Metadata } from 'next';

import { TransferClient } from './TransferClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.economyTransfer.title');
  const description = t('page.economyTransfer.description');

  return {
    title,
    description,
  };
}

async function getBalanceInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      auraBalance: true,
      auraLifetimePurchased: true,
      auraLifetimeTransferred: true,
      auraLifetimeWithdrawn: true,
    },
  });

  if (!user) return null;

  const transferQuota =
    user.auraLifetimePurchased -
    user.auraLifetimeTransferred -
    user.auraLifetimeWithdrawn;

  return {
    auraBalance: user.auraBalance,
    auraLifetimePurchased: user.auraLifetimePurchased,
    transferQuotaAvailable: Math.max(0, transferQuota),
    canTransfer: user.auraLifetimePurchased > 0,
  };
}

export default async function TransferPage() {
  const session = await auth();

  let balanceInfo = null;
  if (session?.user?.id) {
    balanceInfo = await getBalanceInfo(session.user.id);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="text-[var(--primary)]" size={24} /> Enviar Aura
        </h1>
        <p className="text-muted text-sm">Transfiere Aura a otros usuarios. Comisión del 3%.</p>
      </div>

      <TransferClient balanceInfo={balanceInfo} />
    </div>
  );
}