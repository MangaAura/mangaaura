import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BookmarksClient } from './BookmarksClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const metadata: Metadata = {
  title: 'Marcadores | Inkverse',
  description: 'Tus mangas y capítulos marcados',
};

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <BookmarksClient bookmarks={bookmarks} />
      </div>
    </div>
  );
}
