import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FollowingClient } from './FollowingClient';

export const metadata = {
  title: 'Siguiendo | InkVerse',
  description: 'Gestiona las cuentas que sigues',
};

async function getFollowing(userId: string) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      following: { select: { id: true, username: true, displayName: true, avatarUrl: true, level: true } },
    },
  });
  return following;
}

async function getFollowers(userId: string) {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      follower: { select: { id: true, username: true, displayName: true, avatarUrl: true, level: true } },
    },
  });
  return followers;
}

export default async function FollowingPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Inicia sesión</div>;

  const [following, followers] = await Promise.all([
    getFollowing(session.user.id),
    getFollowers(session.user.id),
  ]);

  return (
    <Suspense fallback={<div className="animate-pulse h-96" />}>
      <FollowingClient following={following} followers={followers} />
    </Suspense>
  );
}
