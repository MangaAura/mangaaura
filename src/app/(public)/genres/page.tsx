import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { prisma } from '@/lib/prisma';
import { GenresListPageClient } from './GenresListPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.genres.title');
  const description = t('page.genres.description');

  return {
    title,
    description,
  };
}

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return <GenresListPageClient genres={genres} />;
}
