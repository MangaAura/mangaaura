import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña | MangaAura',
  description: 'Recupera el acceso a tu cuenta de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Recuperar Contraseña | MangaAura',
    description: 'Recupera el acceso a tu cuenta de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recuperar Contraseña | MangaAura',
    description: 'Recupera el acceso a tu cuenta de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/auth/forgot-password' },
};

export default function ForgotPasswordPage(props: any) {
  return <ForgotPasswordClient {...props} />;
}
