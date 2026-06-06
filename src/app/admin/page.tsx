import type { Metadata } from 'next';

import AdminDashboardClient from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Panel de Administración | MangaAura',
  description: 'Panel de administración de MangaAura. Gestiona usuarios, mangas, capítulos, moderación y configuración del sitio.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Panel de Administración — MangaAura',
    description: 'Panel de control administrativo de MangaAura. Estadísticas en tiempo real, gestión de contenido y moderación.',
    type: 'website',
    siteName: 'MangaAura',
    locale: 'es_ES',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Panel de Administración de MangaAura',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Panel de Administración — MangaAura',
    description: 'Panel de control administrativo de MangaAura.',
    images: ['/og-image.png'],
    creator: '@mangaaura',
  },
  alternates: { canonical: '/admin' },
};

export default function AdminDashboardPage(props: any) {
  return <AdminDashboardClient {...props} />;
}
