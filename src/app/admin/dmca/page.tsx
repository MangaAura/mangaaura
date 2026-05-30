import type { Metadata } from 'next';

import DMCAClient from './DMCAClient';

export const metadata: Metadata = {
  title: 'Solicitudes DMCA | MangaAura',
  description: 'Gestiona las solicitudes DMCA y de derechos de autor en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Solicitudes DMCA | MangaAura',
    description: 'Gestiona las solicitudes DMCA y de derechos de autor en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solicitudes DMCA | MangaAura',
    description: 'Gestiona las solicitudes DMCA en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/dmca' },
};

export default function DMCAPage(props: any) {
  return <DMCAClient {...props} />;
}
