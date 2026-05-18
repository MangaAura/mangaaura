import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

import { HomePageClient } from './HomePageClient';
import { WebsiteStructuredData } from '@/components/SEO/StructuredData';
import { prisma } from '@/lib/prisma';


export const metadata: Metadata = {
  title: 'InkVerse - Descubre y Lee Manga',
  description: 'Descubre, lee y comparte manga de calidad en InkVerse. La mejor plataforma para creadores y lectores de manga con miles de títulos disponibles.',
  openGraph: {
    title: 'InkVerse - Descubre y Lee Manga',
    description: 'Descubre, lee y comparte manga de calidad en InkVerse',
  },
};

const getHomeData = unstable_cache(
  async () => {
  const [latestMangas, topMangas, updatingMangas, topUsers, featuredManga, totalMangas, totalReaders, totalChapters] = await Promise.all([
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        status: true,
        tags: true,
        authorName: true,
        author: { select: { username: true } },
        rating: true,
        _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 5,
      orderBy: { totalViews: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        status: true,
        tags: true,
        authorName: true,
        author: { select: { username: true } },
        rating: true,
        totalViews: true,
        _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        status: true,
        tags: true,
        authorName: true,
        author: { select: { username: true } },
        rating: true,
        _count: { select: { chapters: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { xpPoints: 'desc' },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        level: true,
        xpPoints: true,
      },
    }),
    prisma.mangaSeries.findFirst({
      where: { totalViews: { gt: 0 } },
      orderBy: { totalViews: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        description: true,
        authorName: true,
        author: { select: { username: true } },
      },
    }),
    prisma.mangaSeries.count(),
    prisma.user.count(),
    prisma.chapter.count(),
  ]);

  return {
    latestMangas,
    topMangas,
    updatingMangas,
    topUsers,
    featuredManga,
    totalMangas,
    totalReaders,
    totalChapters,
  };
},
  ['home-page-data'],
  { revalidate: 300, tags: ['home'] }
);

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <WebsiteStructuredData />
      <HomePageClient {...data} />
    </>
  );
}
