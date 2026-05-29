import type { Metadata } from 'next';
import BrowseClient from './BrowseClient';

export const metadata: Metadata = {
  title: 'Búsqueda con IA | MangaAura',
  description: 'Descubre manga usando búsqueda inteligente con IA en MangaAura.',
  openGraph: {
    title: 'Búsqueda con IA | MangaAura',
    description: 'Descubre manga usando búsqueda inteligente con IA en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Búsqueda con IA | MangaAura',
    description: 'Búsqueda inteligente de manga con IA en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/search_ia' },
};

export default function BrowsePage(props: any) {
  return <BrowseClient {...props} />;
}
