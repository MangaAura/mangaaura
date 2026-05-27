import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';

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

export const metadata: Metadata = {
  title: 'Mi Perfil | MangaAura',
  description: 'Tu perfil y estadísticas',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/profile');
  }

  const [user, followingData, followersData, libraryEntries, userCollections] = await Promise.all([
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
  ]);

  if (!user) {
    redirect('/auth/login');
  }

  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min(100, (user.xpPoints / xpForNextLevel) * 100);

  return (
    <ProfileClient
      user={user}
      xpProgress={xpProgress}
      xpForNextLevel={xpForNextLevel}
      following={followingData as unknown as FollowItem[]}
      followers={followersData as unknown as FollowItem[]}
      libraryEntries={libraryEntries as unknown as LibraryItem[]}
      collections={userCollections as unknown as CollectionItem[]}
    />
  );
}
