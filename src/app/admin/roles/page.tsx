import type { Metadata } from 'next';

import RolesClient from './RolesClient';

export const metadata: Metadata = {
  title: 'Administrar Roles | MangaAura',
  description: 'Gestiona los roles y permisos de usuarios en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Roles | MangaAura',
    description: 'Gestiona los roles y permisos de usuarios en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Roles | MangaAura',
    description: 'Gestiona los roles y permisos en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/roles' },
};

export default function RolesPage(props: any) {
  return <RolesClient {...props} />;
}
