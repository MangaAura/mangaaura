import type { Metadata } from 'next';
import ForumModerationClient from './ForumModerationClient';

export const metadata: Metadata = {
  title: 'Administrar Foro | MangaAura',
  description: 'Modera y gestiona los hilos del foro en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Foro | MangaAura',
    description: 'Modera y gestiona los hilos del foro en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Foro | MangaAura',
    description: 'Gestiona el foro en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/forum' },
};

export default function ForumModerationPage(props: any) {
  return <ForumModerationClient {...props} />;
}
