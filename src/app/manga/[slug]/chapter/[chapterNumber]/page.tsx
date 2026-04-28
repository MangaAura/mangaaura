import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';

interface ChapterPageProps {
  params: Promise<{ slug: string; chapterNumber: string }>;
}

export async function generateMetadata({ params }: ChapterPageProps) {
  const { slug, chapterNumber } = await params;
  const manga = await prisma.mangaSeries.findUnique({ where: { slug }, select: { title: true } });
  if (!manga) return { title: 'Capítulo no encontrado | InkVerse' };

  return {
    title: `${manga.title} - Capítulo ${chapterNumber} | InkVerse`,
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
