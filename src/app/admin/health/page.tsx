import type { Metadata } from 'next';

import HealthClient from './HealthClient';

export const metadata: Metadata = {
  title: 'Salud del Sistema | MangaAura',
  description: 'Monitorea el estado y rendimiento de los servidores de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Salud del Sistema | MangaAura',
    description: 'Monitorea el estado y rendimiento de los servidores de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salud del Sistema | MangaAura',
    description: 'Monitorea el estado de los servidores de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/health' },
};

export default function HealthPage(props: any) {
  return <HealthClient {...props} />;
}
