import type { Metadata } from 'next';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Explorar Manga | MangaAura',
  description: 'Explora y descubre nuevos mangas en MangaAura. Filtra por género, popularidad y más.',
  openGraph: {
    title: 'Explorar Manga | MangaAura',
    description: 'Explora y descubre nuevos mangas en MangaAura. Filtra por género, popularidad y más.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explorar Manga | MangaAura',
    description: 'Explora y descubre nuevos mangas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/explore' },
};

export default function SearchPage(props: any) {
  return <SearchClient {...props} />;
}
