import type { Metadata } from 'next';
import MangaManagementClient from './MangaManagementClient';

export const metadata: Metadata = {
  title: 'Administrar Mangas | MangaAura',
  description: 'Gestiona todos los mangas y series en la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Mangas | MangaAura',
    description: 'Gestiona todos los mangas y series en la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Mangas | MangaAura',
    description: 'Gestiona los mangas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/manga' },
};

export default function MangaManagementPage(props: any) {
  return <MangaManagementClient {...props} />;
}
