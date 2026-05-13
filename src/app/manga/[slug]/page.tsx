import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import MangaDetailClient from './MangaDetailClient';

interface MangaPageProps {
  params: Promise<{ slug: string }>;
}

async function getMangaData(slug: string) {
  const manga = await prisma.mangaSeries.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { chapterNumber: 'desc' },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          totalPages: true,
          viewCount: true,
          createdAt: true,
        },
      },
      libraryEntries: {
        select: { id: true },
      },
    },
  });

  if (!manga) return null;

  const totalViews = manga.chapters.reduce((sum: number, ch: any) => sum + ch.viewCount, 0);
  const tags = JSON.parse(manga.tags || '[]') as string[];

  return {
    id: manga.id,
    title: manga.title,
    slug: manga.slug,
    description: manga.description || '',
    coverUrl: manga.coverUrl,
    authorId: manga.authorId,
    authorName: manga.authorName,
    status: manga.status,
    tags,
    rating: manga.rating,
    totalViews: totalViews + manga.totalViews,
    createdAt: manga.createdAt,
    updatedAt: manga.updatedAt,
    chapters: manga.chapters,
    libraryCount: manga.libraryEntries.length,
  };
}

export async function generateMetadata({ params }: MangaPageProps) {
  const { slug } = await params;
  const manga = await getMangaData(slug);

  if (!manga) {
    return { title: 'Manga no encontrado | InkVerse' };
  }

  return {
    title: `${manga.title} | InkVerse`,
    description: manga.description || `Lee ${manga.title} en InkVerse. ${manga.chapters.length} capítulos disponibles.`,
  };
}

export default async function MangaDetailPage({ params }: MangaPageProps) {
  const { slug } = await params;
  const manga = await getMangaData(slug);

  if (!manga) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id || null;

  let isInLibrary = false;
  if (userId) {
    const entry = await prisma.userLibrary.findUnique({
      where: {
        userId_mangaId: { userId, mangaId: manga.id },
      },
    });
    isInLibrary = !!entry;
  }

  return <MangaDetailClient manga={manga} isInLibrary={isInLibrary} userId={userId} />;
}
