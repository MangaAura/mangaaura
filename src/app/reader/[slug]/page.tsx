import type { Metadata } from 'next';
import ChapterReaderClient from './ChapterReaderClient';

export const metadata: Metadata = {
  title: 'Lector de Manga | MangaAura',
  description: 'Disfruta de la mejor experiencia de lectura de manga en MangaAura.',
  openGraph: {
    title: 'Lector de Manga | MangaAura',
    description: 'Disfruta de la mejor experiencia de lectura de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lector de Manga | MangaAura',
    description: 'Lee manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/reader/[slug]' },
};

export default function ChapterReaderPage(props: any) {
  return <ChapterReaderClient {...props} />;
}
