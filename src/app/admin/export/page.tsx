import type { Metadata } from 'next';
import ExportClient from './ExportClient';

export const metadata: Metadata = {
  title: 'Exportar Datos | MangaAura',
  description: 'Exporta los datos de la plataforma MangaAura en varios formatos.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Exportar Datos | MangaAura',
    description: 'Exporta los datos de la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exportar Datos | MangaAura',
    description: 'Exporta los datos de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/export' },
};

export default function ExportPage(props: any) {
  return <ExportClient {...props} />;
}
