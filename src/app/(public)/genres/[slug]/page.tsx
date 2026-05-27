import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { GenrePageClient } from './GenrePageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!genre) return { title: 'Género no encontrado' };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';
  return {
    title: `Manga de ${genre.name}`,
    description: `Explora los mejores mangas de ${genre.name} en MangaAura. Lee, descubre y disfruta de contenido de ${genre.name}.`,
    alternates: { canonical: `${siteUrl}/genres/${genre.slug}` },
    openGraph: {
      title: `Manga de ${genre.name} | MangaAura`,
      description: `Explora los mejores mangas de ${genre.name} en MangaAura.`,
      url: `${siteUrl}/genres/${genre.slug}`,
    },
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!genre) notFound();

  return <GenrePageClient slug={slug} />;
}
