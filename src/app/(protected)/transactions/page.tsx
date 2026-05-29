import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { Suspense } from 'react';

import { TransactionsClient } from './TransactionsClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.transactions.title');
  const description = t('page.transactions.description');

  return {
    title,
    description,
  };
}

async function getTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      timestamp: true,
    },
  });
  return transactions;
}

async function getBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { auraBalance: true, xpPoints: true },
  });
  return user;
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Inicia sesión para ver tus transacciones</div>;

  const [transactions, balance] = await Promise.all([
    getTransactions(session.user.id),
    getBalance(session.user.id),
  ]);

  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-[var(--background)]" />}>
      <TransactionsClient transactions={transactions} balance={balance} />
    </Suspense>
  );
}
