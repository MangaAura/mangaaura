import type { Metadata } from 'next';

import { DiscoverClient } from './DiscoverClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Descubrir | MangaAura',
  description: 'Descubre nuevos mangas, tendencias y recomendaciones',
};

async function getDiscoverData() {
  const [trending, recent, topRated] = await Promise.all([
    prisma.mangaSeries.findMany({ orderBy: { totalViews: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    prisma.mangaSeries.findMany({ orderBy: { createdAt: 'desc' }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
    prisma.mangaSeries.findMany({ orderBy: { rating: 'desc' }, where: { rating: { not: null } }, take: 12, select: { id: true, title: true, slug: true, coverUrl: true, status: true, rating: true, totalViews: true, _count: { select: { chapters: true } } } }),
  ]);

  const featuredManga = trending[Math.floor(Math.random() * Math.min(trending.length, 5))];

  return { trending: trending as any, recent: recent as any, topRated: topRated as any, featuredManga: featuredManga as any };
}

export default async function DiscoverPage() {
  const data = await getDiscoverData();

  return <DiscoverClient {...data} />;
}
