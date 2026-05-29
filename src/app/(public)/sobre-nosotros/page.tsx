import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | MangaAura',
  description: 'Conoce más sobre MangaAura, la plataforma definitiva para leer y descubrir manga.',
  openGraph: {
    title: 'Sobre Nosotros | MangaAura',
    description: 'Conoce más sobre MangaAura, la plataforma definitiva para leer y descubrir manga.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre Nosotros | MangaAura',
    description: 'Conoce más sobre MangaAura, la plataforma definitiva para leer y descubrir manga.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/sobre-nosotros' },
};

export default function AboutPage(props: any) {
  return <AboutClient {...props} />;
}
