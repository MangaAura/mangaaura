import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { GenrePageClient } from './GenrePageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

const seoDescriptions: Record<string, { title: string; description: string }> = {
  'yuri': {
    title: 'Manga Yuri | Romance entre chicas',
    description: 'Explora los mejores mangas yuri (romance entre chicas) en MangaAura. Descubre series de amor, drama y relaciones LGBT+ en nuestro catálogo de manga yuri.',
  },
  'a-color': {
    title: 'Manga a Color | Cómic japonés en color',
    description: 'Disfruta del manga a color en MangaAura. Cómic japonés con ilustraciones a todo color para una experiencia de lectura vibrante y única.',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!genre) return { title: 'Género no encontrado' };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';
  const seo = seoDescriptions[slug];

  if (seo) {
    return {
      title: seo.title,
      description: seo.description,
      keywords: [genre.name, slug, `manga ${genre.name.toLowerCase()}`, `manga ${slug}`],
      alternates: { canonical: `${siteUrl}/genres/${genre.slug}` },
      openGraph: {
        title: seo.title,
        description: seo.description,
        url: `${siteUrl}/genres/${genre.slug}`,
      },
    };
  }

  return {
    title: `Manga de ${genre.name}`,
    description: `Explora los mejores mangas de ${genre.name} en MangaAura. Lee, descubre y disfruta del género ${genre.name}.`,
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
