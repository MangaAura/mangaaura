import type { Metadata } from 'next';
import MangaDetailClient from './MangaDetailClient';

export const metadata: Metadata = {
  title: 'Detalle del Manga | MangaAura',
  description: 'Gestiona los capítulos y detalles de tu manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Detalle del Manga | MangaAura',
    description: 'Gestiona los capítulos y detalles de tu manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Detalle del Manga | MangaAura',
    description: 'Gestiona los detalles de tu manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/manga/[slug]' },
};

export default function MangaDetailPage(props: any) {
  return <MangaDetailClient {...props} />;
}
