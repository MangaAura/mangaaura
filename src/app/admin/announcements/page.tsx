import type { Metadata } from 'next';

import AnnouncementsClient from './AnnouncementsClient';

export const metadata: Metadata = {
  title: 'Anuncios | MangaAura',
  description: 'Gestiona los anuncios y comunicaciones de la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Anuncios | MangaAura',
    description: 'Gestiona los anuncios y comunicaciones de la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anuncios | MangaAura',
    description: 'Gestiona los anuncios de la plataforma MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/announcements' },
};

export default function AnnouncementsPage(props: any) {
  return <AnnouncementsClient {...props} />;
}
