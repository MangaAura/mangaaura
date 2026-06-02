import { Megaphone } from 'lucide-react';
import type { Metadata } from 'next';

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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-sunken)] via-[var(--background)] to-[var(--background)]" />
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--accent-purple)]/5 blur-3xl" />
        </div>

        <Container className="relative z-10 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)] border border-[var(--primary)]/20 mb-5">
              <Megaphone className="w-3.5 h-3.5" />
              Comunicados
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                Anuncios
              </span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Novedades importantes, mantenimientos y comunicados oficiales de MangaAura.
            </p>
          </div>
        </Container>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
      </section>

      {/* Announcements List */}
      <section className="relative pb-20">
        <Container>
          <main id="main-content" className="max-w-3xl mx-auto">
            <AnnouncementsList announcements={announcements} />
          </main>
        </Container>
      </section>
    </div>
  );
}
