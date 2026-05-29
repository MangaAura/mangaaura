import type { Metadata } from 'next';
import AnomaliesClient from './AnomaliesClient';

export const metadata: Metadata = {
  title: 'Anomalías de Analytics | MangaAura',
  description: 'Detecta y revisa anomalías en los datos de analytics de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Anomalías de Analytics | MangaAura',
    description: 'Detecta y revisa anomalías en los datos de analytics de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anomalías de Analytics | MangaAura',
    description: 'Detecta y revisa anomalías en analytics de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/analytics/anomalies' },
};

export default function AnomaliesPage(props: any) {
  return <AnomaliesClient {...props} />;
}
