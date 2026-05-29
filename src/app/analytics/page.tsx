import type { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics | MangaAura',
  description: 'Panel de análisis y estadísticas para creadores en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Analytics | MangaAura',
    description: 'Panel de análisis y estadísticas para creadores en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics | MangaAura',
    description: 'Panel de análisis y estadísticas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/analytics' },
};

export default function AnalyticsPage(props: any) {
  return <AnalyticsClient {...props} />;
}
