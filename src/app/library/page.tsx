import type { Metadata } from 'next';
import LibraryClient from './LibraryClient';

export const metadata: Metadata = {
  title: 'Mi Biblioteca | MangaAura',
  description: 'Gestiona tu biblioteca personal de manga en MangaAura.',
  openGraph: {
    title: 'Mi Biblioteca | MangaAura',
    description: 'Gestiona tu biblioteca personal de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi Biblioteca | MangaAura',
    description: 'Gestiona tu biblioteca personal de manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/library' },
};

export default function LibraryPage(props: any) {
  return <LibraryClient {...props} />;
}
