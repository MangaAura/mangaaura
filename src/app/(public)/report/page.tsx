import type { Metadata } from 'next';
import ReportClient from './ReportClient';

export const metadata: Metadata = {
  title: 'Reportar Contenido | MangaAura',
  description: 'Reporta contenido inapropiado, infracciones o violaciones en MangaAura.',
  openGraph: {
    title: 'Reportar Contenido | MangaAura',
    description: 'Reporta contenido inapropiado, infracciones o violaciones en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reportar Contenido | MangaAura',
    description: 'Reporta contenido inapropiado en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/report' },
};

export default function ReportPage(props: any) {
  return <ReportClient {...props} />;
}
