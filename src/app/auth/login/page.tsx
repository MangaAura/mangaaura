import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | MangaAura',
  description: 'Accede a tu cuenta de MangaAura para disfrutar de todo el contenido.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Iniciar Sesión | MangaAura',
    description: 'Accede a tu cuenta de MangaAura para disfrutar de todo el contenido.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iniciar Sesión | MangaAura',
    description: 'Accede a tu cuenta de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/auth/login' },
};

export default function LoginPage(props: any) {
  return <LoginClient {...props} />;
}
