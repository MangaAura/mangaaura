import type { Metadata } from 'next';

import { ForumClient } from './ForumClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Foro | MangaAura',
  description: 'Foro de la comunidad de creadores de MangaAura',
};

async function getForumData() {
  const [categories, threads] = await Promise.all([
    prisma.forumCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { threads: true } },
      },
    }),
    prisma.forumThread.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 30,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        _count: { select: { posts: true } },
      },
    }),
  ]);

  return { categories, threads };
}

export default async function ForumPage() {
  const { categories, threads } = await getForumData();
  const session = await auth();
  const canCreate = !!(session?.user?.id);

  return (
    <ForumClient 
      categories={categories}
      threads={threads}
      canCreate={canCreate}
    />
  );
}