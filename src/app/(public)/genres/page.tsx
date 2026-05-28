import { Metadata } from 'next';

import { prisma } from '@/lib/prisma';
import { GenresListPageClient } from './GenresListPageClient';

export const metadata: Metadata = {
  title: 'Géneros de Manga | Explora por categoría',
  description: 'Explora mangas por género en MangaAura: yuri, acción, aventura, romance, fantasía, a color y más. Encuentra tu próximo manga favorito.',
  keywords: ['géneros de manga', 'manga yuri', 'manga a color', 'manga romance', 'manga acción', 'manga fantasía', 'tipos de manga', 'categorias manga'],
};

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return <GenresListPageClient genres={genres} />;
}
