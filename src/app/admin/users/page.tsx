import type { Metadata } from 'next';
import UsersClient from './UsersClient';

export const metadata: Metadata = {
  title: 'Administrar Usuarios | MangaAura',
  description: 'Gestiona todos los usuarios registrados en la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Usuarios | MangaAura',
    description: 'Gestiona todos los usuarios registrados en la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Usuarios | MangaAura',
    description: 'Gestiona los usuarios en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/users' },
};

export default function UsersPage(props: any) {
  return <UsersClient {...props} />;
}
