import { Metadata } from 'next';

import { GenresListPageClient } from './GenresListPageClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.genres.title');
  const description = t('page.genres.description');

  return {
    title,
    description,
    alternates: { canonical: '/genres' },
  };
}

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return <GenresListPageClient genres={genres} />;
}
