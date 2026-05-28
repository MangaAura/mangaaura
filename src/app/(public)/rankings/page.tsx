import type { Metadata } from 'next';

import RankingsClient from './RankingsClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const metadata: Metadata = {
  title: 'Rankings | MangaAura',
  description: 'Los lectores y creadores más activos de la comunidad',
};

async function getLeaderboards() {
  const [topReaders, topCreators, topClans, trendingManga] = await Promise.all([
    // Top Readers by XP
    prisma.user.findMany({
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

    // Top Creators by views
    prisma.user.findMany({
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

    // Top Clans
    prisma.clan.findMany({
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

    // Trending Manga
    prisma.mangaSeries.findMany({
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
