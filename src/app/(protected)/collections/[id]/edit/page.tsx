import type { Metadata } from 'next';
import EditCollectionClient from './EditCollectionClient';

export const metadata: Metadata = {
  title: 'Editar Colección | MangaAura',
  description: 'Edita los detalles de tu colección de manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Editar Colección | MangaAura',
    description: 'Edita los detalles de tu colección de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editar Colección | MangaAura',
    description: 'Edita los detalles de tu colección de manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/collections/[id]/edit' },
};

export default function EditCollectionPage(props: any) {
  return <EditCollectionClient {...props} />;
}
