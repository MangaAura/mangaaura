import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GenrePageClient } from './GenrePageClient';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

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
  const locale = await detectLocale();
  const t = getT(locale);
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!genre) return { title: t('genres.notFound') };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';
  const seo = seoDescriptions[slug];

  if (seo) {
    return {
      title: seo.title,
      description: seo.description,
      keywords: [genre.name, slug, `manga ${genre.name.toLowerCase()}`, `manga ${slug}`],
      ...withHreflang(`/genres/${genre.slug}`),
      openGraph: {
        title: seo.title,
        description: seo.description,
        url: `${siteUrl}/genres/${genre.slug}`,
      },
    };
  }

  return {
    title: t('genres.metaTitle', { name: genre.name }),
    description: t('genres.metaDescription', { name: genre.name }),
    ...withHreflang(`/genres/${genre.slug}`),
    openGraph: {
      title: t('genres.metaOgTitle', { name: genre.name }),
      description: t('genres.metaDescription', { name: genre.name }),
      url: `${siteUrl}/genres/${genre.slug}`,
    },
  };
}

export default async function GenrePage({ params }: Props) {
  const locale = await detectLocale();
  const t = getT(locale);
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!genre) notFound();

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.genres'), item: '/genres' },
          { name: genre.name, item: `/genres/${slug}` },
        ]}
      />
      <GenrePageClient slug={slug} />
    </>
  );
}
