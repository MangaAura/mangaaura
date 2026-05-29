import type { Metadata } from 'next';
import OfflineClient from './OfflineClient';

export const metadata: Metadata = {
  title: 'Lectura Offline | MangaAura',
  description: 'Gestiona tu contenido descargado para leer sin conexión en MangaAura.',
  openGraph: {
    title: 'Lectura Offline | MangaAura',
    description: 'Gestiona tu contenido descargado para leer sin conexión en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lectura Offline | MangaAura',
    description: 'Contenido offline en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/offline' },
};

export default function OfflinePage(props: any) {
  return <OfflineClient {...props} />;
}
