import type { Metadata } from 'next';
import SearchAnalyticsClient from './SearchAnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics de Búsqueda | MangaAura',
  description: 'Analiza las tendencias y estadísticas de búsqueda en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Analytics de Búsqueda | MangaAura',
    description: 'Analiza las tendencias y estadísticas de búsqueda en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics de Búsqueda | MangaAura',
    description: 'Analiza las búsquedas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/search-analytics' },
};

export default function SearchAnalyticsPage(props: any) {
  return <SearchAnalyticsClient {...props} />;
}
