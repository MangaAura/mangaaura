import type { Metadata } from 'next';

import { prisma } from '@/lib/prisma';
import { AnnouncementsList } from './AnnouncementsList';

export const metadata: Metadata = {
  title: 'Anuncios | MangaAura',
  description: 'Anuncios oficiales, mantenimientos y novedades importantes de MangaAura.',
  openGraph: {
    title: 'Anuncios | MangaAura',
    description: 'Anuncios oficiales, mantenimientos y novedades importantes de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anuncios | MangaAura',
    description: 'Anuncios oficiales, mantenimientos y novedades importantes de MangaAura.',
  },
  alternates: { canonical: '/announcements' },
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      startAt: { lte: new Date() },
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    include: {
      creator: { select: { username: true, displayName: true } },
    },
  });

  return (
    <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2">Anuncios</h1>
      <p className="text-lg text-fg-secondary mb-10">
        Novedades importantes, mantenimientos y comunicados oficiales de MangaAura.
      </p>

      <AnnouncementsList announcements={announcements} />
    </main>
  );
}
