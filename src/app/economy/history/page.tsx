import { History } from 'lucide-react';
import { Metadata } from 'next';

import { HistoryClient } from './HistoryClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.economyHistory.title');
  const description = t('page.economyHistory.description');

  return {
    title,
    description,
  };
}

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 pb-10">
        <div className="text-center py-12 text-muted">
          Inicia sesión para ver tu historial
        </div>
      </div>
    );
  }

  const [transactions, sentTransfers, receivedTransfers] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    }),
    prisma.auraTransfer.findMany({
      where: { fromUserId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.auraTransfer.findMany({
      where: { toUserId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <History className="text-[var(--primary)]" size={24} /> Historial
        </h1>
        <p className="text-muted text-sm">Todas tus transacciones de Aura</p>
      </div>

      <HistoryClient
        transactions={transactions}
        sentTransfers={sentTransfers}
        receivedTransfers={receivedTransfers}
      />
    </div>
  );
}