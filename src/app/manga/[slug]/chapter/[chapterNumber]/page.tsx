import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';

interface ChapterPageProps {
  params: Promise<{ slug: string; chapterNumber: string }>;
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { slug, chapterNumber } = await params;
  const chapterNum = parseInt(chapterNumber, 10);

  const manga = await prisma.mangaSeries.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      coverUrl: true,
      authorName: true,
      rating: true,
    },
  });

  if (!manga) {
    return { title: 'Capítulo no encontrado | MangaAura' };
  }

  const title = `${manga.title} - Capítulo ${chapterNum} | MangaAura`;
  const description = `Lee el capítulo ${chapterNum} de ${manga.title} en MangaAura.${manga.description ? ` ${manga.description.slice(0, 120)}` : ''}`;
  const ogImage = manga.coverUrl
    ? `/api/og?type=chapter&title=${encodeURIComponent(`${manga.title} — Cap. ${chapterNum}`)}&author=${encodeURIComponent(manga.authorName)}&cover=${encodeURIComponent(manga.coverUrl)}${manga.rating ? `&rating=${manga.rating}` : ''}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: `${manga.title} capítulo ${chapterNum}` }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: `/manga/${slug}/chapter/${chapterNum}` },
  };
}

export default async function ChapterReaderPage({ params }: ChapterPageProps) {
  const { slug, chapterNumber } = await params;
  const chapterNum = parseInt(chapterNumber, 10);

  if (isNaN(chapterNum)) notFound();

  const manga = await prisma.mangaSeries.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!manga) notFound();

  const chapter = await prisma.chapter.findFirst({
    where: { mangaId: manga.id, chapterNumber: chapterNum },
    select: { id: true },
  });

  if (!chapter) notFound();

  redirect(`/reader?mangaId=${manga.id}&chapterNumber=${chapterNum}`);
}
