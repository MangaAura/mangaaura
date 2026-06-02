import { Metadata } from 'next';

import { AnnouncementsList } from './AnnouncementsList';
import { Container } from '@/components/Layout/Container';
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
    <div className="relative min-h-screen">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/3 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-amber-500/2 blur-3xl" />
      </div>

      <Container className="relative py-12 md:py-16">
        <main id="main-content" className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
            Anuncios
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed">
            Novedades importantes, mantenimientos y comunicados oficiales de MangaAura.
          </p>

          <AnnouncementsList announcements={announcements} />
        </main>
      </Container>
    </div>
  );
}
