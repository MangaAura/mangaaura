import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';


export const metadata: Metadata = {
  title: 'Mi Perfil | MangaAura',
  description: 'Tu perfil y estadísticas',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/profile');
  }

  // Fetch user data with stats
  const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: {
  _count: {
  select: {
  library: true,
  collections: true,
  following: true,
  achievements: true,
  },
  },
  achievements: {
  include: {
  achievement: true,
  },
  orderBy: { unlockedAt: 'desc' },
  take: 3,
  },
  readingProgress: {
  orderBy: { updatedAt: 'desc' },
  take: 5,
  include: {
  manga: {
  select: {
  id: true,
  title: true,
  slug: true,
  coverUrl: true,
  },
  },
  chapter: {
  select: {
  chapterNumber: true,
  },
  },
  },
  },
  },
  });

  if (!user) {
  redirect('/auth/login');
  }

  // Calculate level progress
  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min(100, (user.xpPoints / xpForNextLevel) * 100);

  return <ProfileClient user={user} xpProgress={xpProgress} xpForNextLevel={xpForNextLevel} />;
}
