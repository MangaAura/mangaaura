import type { Metadata } from 'next';
import TrashClient from './TrashClient';

export const metadata: Metadata = {
  title: 'Papelera | MangaAura',
  description: 'Recupera mangas y capítulos eliminados en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Papelera | MangaAura',
    description: 'Recupera mangas y capítulos eliminados en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Papelera | MangaAura',
    description: 'Recupera elementos eliminados en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/trash' },
};

export default function TrashPage(props: any) {
  return <TrashClient {...props} />;
}
