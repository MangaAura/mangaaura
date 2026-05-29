import type { Metadata } from 'next';
import NewMangaClient from './NewMangaClient';

export const metadata: Metadata = {
  title: 'Nuevo Manga | MangaAura',
  description: 'Publica una nueva serie de manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Nuevo Manga | MangaAura',
    description: 'Publica una nueva serie de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nuevo Manga | MangaAura',
    description: 'Publica un nuevo manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/manga/new' },
};

export default function NewMangaPage(props: any) {
  return <NewMangaClient {...props} />;
}
