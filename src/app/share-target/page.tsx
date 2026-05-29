import type { Metadata } from 'next';
import ShareTargetClient from './ShareTargetClient';

export const metadata: Metadata = {
  title: 'Compartir | MangaAura',
  description: 'Comparte contenido de MangaAura con otros usuarios.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Compartir | MangaAura',
    description: 'Comparte contenido de MangaAura con otros usuarios.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compartir | MangaAura',
    description: 'Comparte contenido de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/share-target' },
};

export default function ShareTargetPage(props: any) {
  return <ShareTargetClient {...props} />;
}
