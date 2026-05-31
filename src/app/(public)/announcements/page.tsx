import { Metadata } from 'next';

import { AnnouncementsList } from './AnnouncementsList';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.announcements.title');
  const description = t('page.announcements.description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    ...withHreflang('/announcements'),
  };
}

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
