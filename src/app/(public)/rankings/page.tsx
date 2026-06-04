import { Metadata } from 'next';

import RankingsClient from './RankingsClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withCache, generateCacheKey } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.rankings.title');
  const description = t('page.rankings.description');

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
    ...withHreflang('/rankings'),
  };
}

const cacheTtl = 360;

async function getLeaderboards() {
  const [topReaders, topCreators, topClans, trendingManga] = await Promise.all([
    // Top Readers by XP
    withCache(
      generateCacheKey('rankings:readers', {}),
      cacheTtl,
      () => prisma.user.findMany({
        take: 50,
        orderBy: { xpPoints: 'desc' },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          xpPoints: true,
          level: true,
          readingStreak: true,
          _count: {
            select: { readingProgress: true },
          },
        },
      }),
    ),

    // Top Creators by views
    withCache(
      generateCacheKey('rankings:creators', {}),
      cacheTtl,
      () => prisma.user.findMany({
        take: 50,
        where: {
          createdMangas: { some: { deletedAt: null } },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: {
            select: { createdMangas: true },
          },
          createdMangas: {
            where: { deletedAt: null },
            select: {
              totalViews: true,
              _count: { select: { chapters: true } },
            },
          },
        },
      }),
    ),

    // Top Clans
    withCache(
      generateCacheKey('rankings:clans', {}),
      cacheTtl,
      () => prisma.clan.findMany({
        take: 50,
        orderBy: { totalScore: 'desc' },
        include: {
          leader: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
    ),

    // Trending Manga
    withCache(
      generateCacheKey('rankings:manga', {}),
      cacheTtl,
      () => prisma.mangaSeries.findMany({
        where: { deletedAt: null },
        take: 50,
        orderBy: { totalViews: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          totalViews: true,
          rating: true,
          author: {
            select: {
              username: true,
              displayName: true,
            },
          },
          _count: {
            select: { chapters: true },
          },
        },
      }),
    ),
  ]);

  // Process creators data
  const processedCreators = topCreators.map((creator) => ({
    ...creator,
    totalViews: creator.createdMangas.reduce((sum, m) => sum + m.totalViews, 0),
    totalChapters: creator.createdMangas.reduce((sum, m) => sum + m._count.chapters, 0),
  }));

  return {
    readers: topReaders,
    creators: processedCreators.sort((a, b) => b.totalViews - a.totalViews),
    clans: topClans,
    manga: trendingManga,
  };
}

// ISR: revalidate every 6 min (matching cache TTL)
export const revalidate = 360;

export default async function RankingsPage() {
  const session = await auth();
  const leaderboards = await getLeaderboards();

  return (
    <RankingsClient 
      leaderboards={leaderboards}
      currentUserId={session?.user?.id}
    />
  );
}
