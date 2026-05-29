import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { redirect } from 'next/navigation';

import { BookmarksClient } from './BookmarksClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.bookmarks.title');
  const description = t('page.bookmarks.description');

  return {
    title,
    description,
  };
}

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
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
          id: true,
          chapterNumber: true,
          title: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <BookmarksClient bookmarks={bookmarks} />
      </div>
    </div>
  );
}
