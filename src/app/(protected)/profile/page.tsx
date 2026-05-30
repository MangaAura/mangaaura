import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import ProfileClient from './ProfileClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface FollowItem {
  id: string;
  following: {
    id: string;
    username: string;
    displayName: string | null;
    level: number;
    avatarUrl: string | null;
  };
  follower: {
    id: string;
    username: string;
    displayName: string | null;
    level: number;
    avatarUrl: string | null;
  };
}

interface LibraryItem {
  id: string;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  status: string;
}

interface CollectionItem {
  id: string;
  title: string;
  coverUrl: string | null;
  description: string | null;
  _count: {
    items: number;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.profile.title');
  const description = t('page.profile.description');

  return {
    title,
    description,
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/profile');
  }

  const [user, followingData, followersData, libraryEntries, userCollections, activitiesFeed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            library: true,
            collections: true,
            following: true,
            followers: true,
            achievements: true,
          },
        },
        clanMemberships: {
          take: 1,
          orderBy: { joinedAt: 'desc' },
          include: {
            clan: {
              select: { id: true, name: true, slug: true, emblemUrl: true },
            },
          },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
          take: 100,
        },
        readingProgress: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            manga: {
              select: { id: true, title: true, slug: true, coverUrl: true },
            },
            chapter: {
              select: { chapterNumber: true },
            },
          },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followingId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
        },
      },
    }),
    prisma.userLibrary.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: 'desc' },
      take: 50,
      include: {
        manga: {
          select: { id: true, title: true, slug: true, coverUrl: true },
        },
      },
    }),
    prisma.collection.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    }),
    prisma.userActivity.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  if (!user) {
    redirect('/auth/login');
  }

  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min(100, (user.xpPoints / xpForNextLevel) * 100);

  return (
    <ProfileClient
      user={user as any}
      xpProgress={xpProgress}
      xpForNextLevel={xpForNextLevel}
      following={followingData as unknown as FollowItem[]}
      followers={followersData as unknown as FollowItem[]}
      libraryEntries={libraryEntries as unknown as LibraryItem[]}
      collections={userCollections as unknown as CollectionItem[]}
      activities={activitiesFeed as any}
    />
  );
}
