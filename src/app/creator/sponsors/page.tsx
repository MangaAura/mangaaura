import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CreatorSponsors } from '@/components/Sponsorships/CreatorSponsors';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Patrocinios | Creador | Inkverse',
  description: 'Gestiona los patrocinios de tus capítulos',
};

async function getCreatorSponsors(userId: string) {
  const mangas = await prisma.mangaSeries.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      title: true,
      slug: true,
      chapters: {
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          sponsorshipBids: {
            where: { status: 'ACTIVE' },
            include: {
              user: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { bidAmount: 'desc' },
          },
        },
        orderBy: { chapterNumber: 'desc' },
        take: 10,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const recentBids = await prisma.sponsorshipBid.findMany({
    where: {
      chapter: { manga: { authorId: userId } },
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      chapter: { select: { id: true, chapterNumber: true, title: true, manga: { select: { title: true, slug: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const stats = {
    totalBids: recentBids.length,
    activeBids: recentBids.filter(b => b.status === 'ACTIVE').length,
    totalRevenue: recentBids.reduce((sum, b) => sum + b.bidAmount, 0),
    uniqueSponsors: new Set(recentBids.map(b => b.userId)).size,
  };

  return { mangas, recentBids, stats };
}

export default async function CreatorSponsorsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const { mangas, recentBids, stats } = await getCreatorSponsors(session.user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Patrocinios</h1>
        <p className="text-muted">Gestiona los patrocinios de tus capítulos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold">{stats.totalBids}</p>
          <p className="text-xs text-muted">Pujas totales</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-accent-green">{stats.activeBids}</p>
          <p className="text-xs text-muted">Pujas activas</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-[var(--warning)]">{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted">IC recaudados</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-accent-blue">{stats.uniqueSponsors}</p>
          <p className="text-xs text-muted">Patrocinadores únicos</p>
        </div>
      </div>

      <CreatorSponsors mangas={mangas as any} recentBids={recentBids as any} />
    </div>
  );
}
