import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { DiscoverClient } from './DiscoverClient';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.discover.title');
  const description = t('page.discover.description');

  return {
    title,
    description,
  };
}

async function getDiscoverData() {
  const [trending, recent, topRated] = await Promise.all([
    prisma.mangaSeries.findMany({ where: { deletedAt: null }, orderBy: { totalViews: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    prisma.mangaSeries.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    prisma.mangaSeries.findMany({ where: { deletedAt: null, rating: { not: null } }, orderBy: { rating: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
  ]);

  const featuredManga = trending[Math.floor(Math.random() * Math.min(trending.length, 5))];

  return { trending: trending as any, recent: recent as any, topRated: topRated as any, featuredManga: featuredManga as any };
}

export default async function DiscoverPage() {
  const data = await getDiscoverData();

  return <DiscoverClient {...data} />;
}
