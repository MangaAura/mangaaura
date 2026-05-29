import type { Metadata } from 'next';
import CreatorCommunityClient from './CreatorCommunityClient';

export const metadata: Metadata = {
  title: 'Comunidad de Creadores | MangaAura',
  description: 'Conecta con otros creadores en la comunidad de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Comunidad de Creadores | MangaAura',
    description: 'Conecta con otros creadores en la comunidad de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comunidad de Creadores | MangaAura',
    description: 'Comunidad de creadores en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/community' },
};

export default function CreatorCommunityPage(props: any) {
  return <CreatorCommunityClient {...props} />;
}
