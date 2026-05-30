import type { Metadata } from 'next';

import ChapterManagementClient from './ChapterManagementClient';

export const metadata: Metadata = {
  title: 'Administrar Capítulos | MangaAura',
  description: 'Gestiona todos los capítulos de la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Capítulos | MangaAura',
    description: 'Gestiona todos los capítulos de la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Capítulos | MangaAura',
    description: 'Gestiona los capítulos en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/chapters' },
};

export default function ChapterManagementPage(props: any) {
  return <ChapterManagementClient {...props} />;
}
