import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MangaStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
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

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const manga = await getMangaData(slug);

  if (!manga) {
    return { title: 'Manga no encontrado | InkVerse' };
  }

  const title = `${manga.title} | InkVerse`;
  const description = manga.description?.slice(0, 160) || `Lee ${manga.title} en InkVerse. ${manga.chapters.length} capítulos disponibles.`;
  const ogImage = manga.coverUrl
    ? `/api/og?type=manga&title=${encodeURIComponent(manga.title)}&author=${encodeURIComponent(manga.authorName)}&cover=${encodeURIComponent(manga.coverUrl)}${manga.rating ? `&rating=${manga.rating}` : ''}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: manga.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: `/manga/${slug}` },
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

  return (
    <>
      <MangaStructuredData
        title={manga.title}
        description={manga.description}
        author={manga.authorName}
        coverUrl={manga.coverUrl || undefined}
        slug={manga.slug}
        rating={manga.rating || undefined}
        tags={manga.tags}
        totalChapters={manga.chapters.length}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Manga', item: '/browse' },
          { name: manga.title, item: `/manga/${manga.slug}` },
        ]}
      />
      <MangaDetailClient manga={manga} isInLibrary={isInLibrary} userId={userId} />
    </>
  );
}
