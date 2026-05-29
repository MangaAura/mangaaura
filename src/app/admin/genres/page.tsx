import type { Metadata } from 'next';
import AdminGenresClient from './AdminGenresClient';

export const metadata: Metadata = {
  title: 'Administrar Géneros | MangaAura',
  description: 'Gestiona los géneros y categorías de manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Géneros | MangaAura',
    description: 'Gestiona los géneros y categorías de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Géneros | MangaAura',
    description: 'Gestiona los géneros en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/genres' },
};

export default function AdminGenresPage(props: any) {
  return <AdminGenresClient {...props} />;
}
