import type { Metadata } from 'next';
import AuthErrorClient from './AuthErrorClient';

export const metadata: Metadata = {
  title: 'Error de Autenticación | MangaAura',
  description: 'Ocurrió un error durante la autenticación en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Error de Autenticación | MangaAura',
    description: 'Ocurrió un error durante la autenticación en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Error de Autenticación | MangaAura',
    description: 'Error de autenticación en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/auth/error' },
};

export default function AuthError(props: any) {
  return <AuthErrorClient {...props} />;
}
