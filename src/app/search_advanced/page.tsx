import type { Metadata } from 'next';
import AdvancedSearchClient from './AdvancedSearchClient';

export const metadata: Metadata = {
  title: 'Búsqueda Avanzada | MangaAura',
  description: 'Encuentra manga con filtros avanzados en MangaAura.',
  openGraph: {
    title: 'Búsqueda Avanzada | MangaAura',
    description: 'Encuentra manga con filtros avanzados en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Búsqueda Avanzada | MangaAura',
    description: 'Búsqueda avanzada de manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/search_advanced' },
};

export default function AdvancedSearchPage(props: any) {
  return <AdvancedSearchClient {...props} />;
}
