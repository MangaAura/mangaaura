import type { Metadata } from 'next';
import CreatorUploadClient from './CreatorUploadClient';

export const metadata: Metadata = {
  title: 'Subir Capítulo | MangaAura',
  description: 'Sube un nuevo capítulo de tu manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Subir Capítulo | MangaAura',
    description: 'Sube un nuevo capítulo de tu manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subir Capítulo | MangaAura',
    description: 'Sube un capítulo de tu manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/upload' },
};

export default function CreatorUploadPage(props: any) {
  return <CreatorUploadClient {...props} />;
}
