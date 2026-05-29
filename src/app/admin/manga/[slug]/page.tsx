import type { Metadata } from 'next';
import EditMangaClient from './EditMangaClient';

export const metadata: Metadata = {
  title: 'Editar Manga | MangaAura',
  description: 'Edita los detalles de un manga en la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Editar Manga | MangaAura',
    description: 'Edita los detalles de un manga en la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editar Manga | MangaAura',
    description: 'Edita un manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/manga/[slug]' },
};

export default function EditMangaPage(props: any) {
  return <EditMangaClient {...props} />;
}
