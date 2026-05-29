import type { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña | MangaAura',
  description: 'Establece una nueva contraseña para tu cuenta de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Restablecer Contraseña | MangaAura',
    description: 'Establece una nueva contraseña para tu cuenta de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restablecer Contraseña | MangaAura',
    description: 'Restablece tu contraseña en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/auth/reset-password' },
};

export default function ResetPasswordPage(props: any) {
  return <ResetPasswordClient {...props} />;
}
