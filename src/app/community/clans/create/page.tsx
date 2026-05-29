import type { Metadata } from 'next';
import CreateClanClient from './CreateClanClient';

export const metadata: Metadata = {
  title: 'Crear Clán | MangaAura',
  description: 'Crea tu propio clán en MangaAura y reúne a otros amantes del manga.',
  openGraph: {
    title: 'Crear Clán | MangaAura',
    description: 'Crea tu propio clán en MangaAura y reúne a otros amantes del manga.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crear Clán | MangaAura',
    description: 'Crea tu propio clán en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/community/clans/create' },
};

export default function CreateClanPage(props: any) {
  return <CreateClanClient {...props} />;
}
