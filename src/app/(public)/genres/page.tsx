import { Metadata } from 'next';

import { prisma } from '@/lib/prisma';
import { GenresListPageClient } from './GenresListPageClient';

export const metadata: Metadata = {
  title: 'Géneros de Manga',
  description: 'Explora mangas por género en MangaAura. Acción, aventura, romance, fantasía y más.',
};

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return <GenresListPageClient genres={genres} />;
}
