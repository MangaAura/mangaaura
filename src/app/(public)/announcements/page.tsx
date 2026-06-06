import { Megaphone, ArrowRight, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AnnouncementsList } from './AnnouncementsList';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import {
  BreadcrumbStructuredData,
  WebPageStructuredData,
} from '@/components/SEO/StructuredData';
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
  const locale = await detectLocale();
  const t = getT(locale);

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
    <>
      <WebPageStructuredData
        name={t('page.announcements.title') + ' | MangaAura'}
        description={t('page.announcements.description')}
        url="/announcements"
        datePublished="2025-01-01"
        dateModified={new Date().toISOString().split('T')[0]}
        breadcrumbs={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.announcements'), item: '/announcements' },
        ]}
      />
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.announcements'), item: '/announcements' },
        ]}
      />

      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none" />

        <Container className="relative z-10 py-12">
          <PageHeader
            title={t('page.announcements.heroTitle')}
            description={t('page.announcements.heroSubtitle')}
            icon={<Megaphone className="w-8 h-8" />}
          />
        </Container>

        {/* Announcements List */}
        <section className="relative pb-20">
          <Container>
            <main id="main-content" className="max-w-3xl mx-auto">
              <AnnouncementsList announcements={announcements} />
            </main>
          </Container>
        </section>

        {/* CTA */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent-purple)]/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />

          <Container>
            <div className="relative max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('page.announcements.ctaTitle')}
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">
                {t('page.announcements.ctaDescription')}
              </p>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105"
              >
                {t('page.announcements.ctaButton')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </Container>
        </section>
      </div>
    </>
  );
}
