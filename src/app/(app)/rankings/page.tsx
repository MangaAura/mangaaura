import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { LeaderboardTable } from '@/components/Rankings/LeaderboardTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Trophy, Users, Crown, Flame, BookOpen } from 'lucide-react';
import RankingsClient from './RankingsClient';

export const metadata: Metadata = {
  title: 'Rankings | Inkverse',
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
        createdMangas: { some: {} },
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
  const processedCreators = topCreators.map((creator: any) => ({
    ...creator,
    totalViews: creator.createdMangas.reduce((sum: any, m: any) => sum + m.totalViews, 0),
    totalChapters: creator.createdMangas.reduce((sum: any, m: any) => sum + m._count.chapters, 0),
  }));

  return {
    readers: topReaders,
    creators: processedCreators.sort((a: any, b: any) => b.totalViews - a.totalViews),
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
