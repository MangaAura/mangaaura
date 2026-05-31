import { Metadata } from 'next';

import { GenresListPageClient } from './GenresListPageClient';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.genres.title');
  const description = t('page.genres.description');

  return {
    title,
    description,
    ...withHreflang('/genres'),
  };
}

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Géneros', item: '/genres' },
        ]}
      />
      <GenresListPageClient genres={genres} />
    </>
  );
}
