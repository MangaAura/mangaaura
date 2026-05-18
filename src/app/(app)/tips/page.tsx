import { Suspense } from 'react';

import { TipsClient } from './TipsClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Propinas | InkVerse',
  description: 'Historial de propinas enviadas y recibidas',
};

async function getTips(userId: string) {
  const [sent, received] = await Promise.all([
    prisma.tip.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        toUser: { select: { id: true, username: true, avatarUrl: true } },
        chapter: { select: { chapterNumber: true, manga: { select: { title: true, slug: true } } } },
      },
    }),
    prisma.tip.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        fromUser: { select: { id: true, username: true, avatarUrl: true } },
        chapter: { select: { chapterNumber: true, manga: { select: { title: true, slug: true } } } },
      },
    }),
  ]);

  const totalSent = sent.reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = received.reduce((sum, t) => sum + t.amount, 0);

  return { sent: sent as any, received: received as any, stats: { sent: sent.length, received: received.length, totalSent, totalReceived } };
}

export default async function TipsPage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted">Inicia sesión para ver tus propinas</div>;

  const { sent, received, stats } = await getTips(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Propinas</h1>
        <p className="text-muted">Historial de propinas enviadas y recibidas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-accent-blue">{stats.totalSent.toLocaleString()}</p>
          <p className="text-xs text-muted">IC enviados ({stats.sent} props)</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-accent-green">{stats.totalReceived.toLocaleString()}</p>
          <p className="text-xs text-muted">IC recibidos ({stats.received} props)</p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse h-96 bg-tertiary rounded-xl" />}>
        <TipsClient sent={sent} received={received} />
      </Suspense>
    </div>
  );
}
