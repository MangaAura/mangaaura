import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { UserProfileClient } from './UserProfileClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

async function getUserData(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          library: true,
          collections: true,
          following: true,
          followers: true,
          achievements: true,
          createdMangas: true,
          activitiesFeed: true,
        },
      },
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: 100,
      },
      createdMangas: {
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          status: true,
          rating: true,
          totalViews: true,
          _count: { select: { chapters: true } },
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
      activitiesFeed: {
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      collections: {
        where: { isPublic: true },
        orderBy: { updatedAt: 'desc' },
        take: 12,
        include: {
          _count: { select: { items: true, likes: true } },
        },
      },
    },
  });

  return user as any;
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserData(username);

  if (!user) {
    return { title: 'Usuario no encontrado | MangaAura' };
  }

  const displayName = user.displayName || user.username;
  const title = `${displayName} | MangaAura`;
  const description = `Perfil de ${displayName} en MangaAura · Nivel ${user.level} · ${user._count.createdMangas} mangas creados`;
  const ogImage = user.avatarUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: ogImage ? [{ url: ogImage, width: 400, height: 400, alt: displayName }] : undefined,
      username: user.username,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: `/user/${username}` },
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const session = await auth();
  const user = await getUserData(username);

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === user.id;

  const isFollowingUser = !isOwnProfile && session?.user?.id
    ? !!(await prisma.follow.findFirst({
        where: { followerId: session.user.id, followingId: user.id },
      }))
    : false;

  const [followingData, followersData, libraryEntries] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
        },
      },
    }),
    prisma.userLibrary.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
      take: 50,
      include: {
        manga: {
          select: { id: true, title: true, slug: true, coverUrl: true },
        },
      },
    }),
  ]);

  return (
    <UserProfileClient
      user={user}
      isOwnProfile={isOwnProfile}
      sessionUserId={session?.user?.id}
      following={followingData as any}
      followers={followersData as any}
      libraryEntries={libraryEntries as any}
      isFollowingUser={isFollowingUser}
    />
  );
}
