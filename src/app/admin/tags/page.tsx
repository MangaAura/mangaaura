import type { Metadata } from 'next';
import AdminTagsClient from './AdminTagsClient';

export const metadata: Metadata = {
  title: 'Administrar Etiquetas | MangaAura',
  description: 'Gestiona las etiquetas y categorías de contenido en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Etiquetas | MangaAura',
    description: 'Gestiona las etiquetas y categorías de contenido en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Etiquetas | MangaAura',
    description: 'Gestiona las etiquetas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/tags' },
};

export default function AdminTagsPage(props: any) {
  return <AdminTagsClient {...props} />;
}
