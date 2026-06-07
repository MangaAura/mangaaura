import type { Metadata } from 'next';

import AdminBlogClient from './AdminBlogClient';

export const metadata: Metadata = {
  title: 'Administrar Blog | MangaAura',
  description: 'Gestiona los artículos del blog en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Blog | MangaAura',
    description: 'Gestiona los artículos del blog en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Blog | MangaAura',
    description: 'Gestiona el blog en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/blog' },
};

export default function AdminBlogPage(props: any) {
  return <AdminBlogClient {...props} />;
}
