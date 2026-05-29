import type { Metadata } from 'next';
import BansClient from './BansClient';

export const metadata: Metadata = {
  title: 'Sanciones y Bloqueos | MangaAura',
  description: 'Gestiona las sanciones y bloqueos de usuarios en la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sanciones y Bloqueos | MangaAura',
    description: 'Gestiona las sanciones y bloqueos de usuarios en la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanciones y Bloqueos | MangaAura',
    description: 'Gestiona las sanciones en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/bans' },
};

export default function BansPage(props: any) {
  return <BansClient {...props} />;
}
