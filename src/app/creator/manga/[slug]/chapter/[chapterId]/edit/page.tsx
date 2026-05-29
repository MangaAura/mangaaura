import type { Metadata } from 'next';
import EditChapterClient from './EditChapterClient';

export const metadata: Metadata = {
  title: 'Editar Capítulo | MangaAura',
  description: 'Sube y edita las páginas de un capítulo de tu manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Editar Capítulo | MangaAura',
    description: 'Sube y edita las páginas de un capítulo de tu manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editar Capítulo | MangaAura',
    description: 'Edita un capítulo de tu manga en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/manga/[slug]/chapter/[chapterId]/edit' },
};

export default function EditChapterPage(props: any) {
  return <EditChapterClient {...props} />;
}
