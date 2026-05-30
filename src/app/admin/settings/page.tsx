import type { Metadata } from 'next';

import AdminSettingsClient from './AdminSettingsClient';

export const metadata: Metadata = {
  title: 'Configuración del Sitio | MangaAura',
  description: 'Configura los ajustes globales de la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Configuración del Sitio | MangaAura',
    description: 'Configura los ajustes globales de la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configuración del Sitio | MangaAura',
    description: 'Configura los ajustes globales de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/settings' },
};

export default function AdminSettingsPage(props: any) {
  return <AdminSettingsClient {...props} />;
}
