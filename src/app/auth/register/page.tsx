import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Crear Cuenta | MangaAura',
  description: 'Regístrate en MangaAura y descubre un mundo de manga.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Crear Cuenta | MangaAura',
    description: 'Regístrate en MangaAura y descubre un mundo de manga.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crear Cuenta | MangaAura',
    description: 'Regístrate en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/auth/register' },
};

export default function RegisterPage(props: any) {
  return <RegisterClient {...props} />;
}
