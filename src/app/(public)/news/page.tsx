import type { Metadata } from 'next';
import { Suspense } from 'react';

import { NewsClient } from './NewsClient';

export const metadata: Metadata = {
  title: 'Noticias de InkVerse | Inkverse',
  description:
    'Últimas noticias, novedades y actualizaciones de InkVerse - la plataforma de manga con inteligencia artificial. Novedades de la comunidad, nuevas herramientas y más.',
  openGraph: {
    title: 'Noticias de InkVerse | Inkverse',
    description:
      'Últimas noticias, novedades y actualizaciones de InkVerse - la plataforma de manga con IA.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noticias de InkVerse | Inkverse',
    description:
      'Últimas noticias, novedades y actualizaciones de InkVerse.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/news',
  },
};

export default function NewsPage() {
  return (
    <Suspense fallback={null}>
      <NewsClient />
    </Suspense>
  );
}
