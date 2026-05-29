import type { Metadata } from 'next';
import EditMangaClient from './EditMangaClient';

export const metadata: Metadata = {
  title: 'Editar Manga | MangaAura',
  description: 'Edita los detalles de tu serie de manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Editar Manga | MangaAura',
    description: 'Edita los detalles de tu serie de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editar Manga | MangaAura',
    description: 'Edita tu manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/manga/[slug]/edit' },
};

export default function EditMangaPage(props: any) {
  return <EditMangaClient {...props} />;
}
