import type { Metadata } from 'next';
import EditChapterClient from './EditChapterClient';

export const metadata: Metadata = {
  title: 'Detalle del Capítulo | MangaAura',
  description: 'Revisa y edita los detalles de un capítulo de manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Detalle del Capítulo | MangaAura',
    description: 'Revisa y edita los detalles de un capítulo de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Detalle del Capítulo | MangaAura',
    description: 'Revisa los detalles de un capítulo en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/chapters/[id]' },
};

export default function EditChapterPage(props: any) {
  return <EditChapterClient {...props} />;
}
