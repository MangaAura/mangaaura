import type { Metadata } from 'next';

import AdminDashboardClient from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Panel de Administración | MangaAura',
  description: 'Panel de administración de MangaAura. Gestiona usuarios, mangas, capítulos y más.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Panel de Administración | MangaAura',
    description: 'Panel de administración de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Panel de Administración | MangaAura',
    description: 'Panel de administración de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin' },
};

export default function AdminDashboardPage(props: any) {
  return <AdminDashboardClient {...props} />;
}
