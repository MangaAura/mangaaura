import type { Metadata } from 'next';
import AdminNewsClient from './AdminNewsClient';

export const metadata: Metadata = {
  title: 'Administrar Noticias | MangaAura',
  description: 'Gestiona las noticias y artículos del blog en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Noticias | MangaAura',
    description: 'Gestiona las noticias y artículos del blog en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Noticias | MangaAura',
    description: 'Gestiona las noticias en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/news' },
};

export default function AdminNewsPage(props: any) {
  return <AdminNewsClient {...props} />;
}
