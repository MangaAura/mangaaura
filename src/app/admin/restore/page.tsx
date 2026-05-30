import type { Metadata } from 'next';

import RestoreClient from './RestoreClient';

export const metadata: Metadata = {
  title: 'Restaurar Usuarios | MangaAura',
  description: 'Restaura cuentas de usuario eliminadas en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Restaurar Usuarios | MangaAura',
    description: 'Restaura cuentas de usuario eliminadas en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restaurar Usuarios | MangaAura',
    description: 'Restaura cuentas de usuario en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/restore' },
};

export default function RestorePage(props: any) {
  return <RestoreClient {...props} />;
}
