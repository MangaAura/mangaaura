import { Metadata } from 'next';

import { DiscoverClient } from './DiscoverClient';
import { BreadcrumbStructuredData, FAQPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withCache, generateCacheKey } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.discover.title');
  const description = t('page.discover.description');

  return {
    title,
    description,
    ...withHreflang('/discover'),
  };
}

async function getDiscoverData() {
  const cacheTtl = 360;
  const [trending, recent, topRated] = await Promise.all([
    withCache(
      generateCacheKey('discover:trending', {}),
      cacheTtl,
      () => prisma.mangaSeries.findMany({ where: { deletedAt: null }, orderBy: { totalViews: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    ),
    withCache(
      generateCacheKey('discover:recent', {}),
      cacheTtl,
      () => prisma.mangaSeries.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    ),
    withCache(
      generateCacheKey('discover:toprated', {}),
      cacheTtl,
      () => prisma.mangaSeries.findMany({ where: { deletedAt: null, rating: { not: null } }, orderBy: { rating: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    ),
  ]);

  const featuredManga = trending[Math.floor(Math.random() * Math.min(trending.length, 5))];

  return { trending, recent, topRated, featuredManga };
}

// ISR: revalidate every 6 min (matching cache TTL)
export const revalidate = 360;

export default async function DiscoverPage() {
  const locale = await detectLocale();
  const t = getT(locale);
  const data = await getDiscoverData();

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.discover'), item: '/discover' },
        ]}
      />
      <FAQPageStructuredData
        items={[
          {
            question: '¿Qué es MangaAura?',
            answer: 'MangaAura es la plataforma de manga con IA para leer, crear y crowdfundear capítulos. Es gratis para lectores y ofrece herramientas de IA para creadores.',
          },
          {
            question: '¿Es gratis leer manga en MangaAura?',
            answer: 'Sí, leer manga en MangaAura es completamente gratis. No hay suscripciones obligatorias ni límites de lectura.',
          },
          {
            question: '¿Cómo se compara MangaAura con Webtoon o Manga Plus?',
            answer: 'MangaAura ofrece lectura gratuita como Webtoon y Manga Plus, pero añade herramientas de IA para creadores, crowdfunding de capítulos con Aura, gamificación con XP y una comunidad activa con clanes y foros. Compara todas las plataformas en mangaaura.es/comparison.',
          },
        ]}
      />
      <DiscoverClient {...data} />
    </>
  );
}
