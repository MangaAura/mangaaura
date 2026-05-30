import { Metadata } from 'next';

import { ForumClient } from './ForumClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.forum.title');
  const description = t('page.forum.description');

  return {
    title,
    description,
  };
}

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