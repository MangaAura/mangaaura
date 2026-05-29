import type { Metadata } from 'next';
import EditUserClient from './EditUserClient';

export const metadata: Metadata = {
  title: 'Detalle de Usuario | MangaAura',
  description: 'Revisa y edita los detalles de un usuario en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Detalle de Usuario | MangaAura',
    description: 'Revisa y edita los detalles de un usuario en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Detalle de Usuario | MangaAura',
    description: 'Revisa los detalles de un usuario en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/users/[slug]' },
};

export default function EditUserPage(props: any) {
  return <EditUserClient {...props} />;
}
