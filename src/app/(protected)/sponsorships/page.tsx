import { Gem } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SponsorshipsList } from '@/components/Sponsorships/SponsorshipsList';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Mis Patrocinios | MangaAura',
  description: 'Gestiona tus patrocinios y pujas en capítulos',
};

async function getSponsorships(userId: string) {
  const [activeBids, wonBids, history] = await Promise.all([
    prisma.sponsorshipBid.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        chapter: { select: { id: true, chapterNumber: true, title: true, manga: { select: { id: true, title: true, slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.sponsorshipBid.findMany({
      where: { userId, isWinning: true, status: { not: 'ACTIVE' } },
      include: {
        chapter: { select: { id: true, chapterNumber: true, title: true, manga: { select: { id: true, title: true, slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.sponsorshipBid.findMany({
      where: { userId, status: 'LOST' },
      include: {
        chapter: { select: { id: true, chapterNumber: true, title: true, manga: { select: { id: true, title: true, slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return { activeBids, wonBids, history };
}

export default async function SponsorshipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const { activeBids, wonBids, history } = await getSponsorships(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Gem className="text-[var(--primary)]" size={30} /> Mis Patrocinios
        </h1>
        <p className="text-muted">Gestiona tus pujas y patrocinios en capítulos</p>
      </div>
      <SponsorshipsList activeBids={activeBids as any} wonBids={wonBids as any} history={history as any} />
    </div>
  );
}
