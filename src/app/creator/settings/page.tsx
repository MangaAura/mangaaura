import type { Metadata } from 'next';
import CreatorSettingsClient from './CreatorSettingsClient';

export const metadata: Metadata = {
  title: 'Configuración del Creador | MangaAura',
  description: 'Ajusta la configuración de tu perfil como creador en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Configuración del Creador | MangaAura',
    description: 'Ajusta la configuración de tu perfil como creador en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configuración del Creador | MangaAura',
    description: 'Configuración de creador en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/settings' },
};

export default function CreatorSettingsPage(props: any) {
  return <CreatorSettingsClient {...props} />;
}
