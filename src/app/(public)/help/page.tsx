import type { Metadata } from 'next';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'Ayuda | MangaAura',
  description: 'Encuentra respuestas a tus preguntas sobre MangaAura. Guías, tutoriales y soporte.',
  openGraph: {
    title: 'Ayuda | MangaAura',
    description: 'Encuentra respuestas a tus preguntas sobre MangaAura. Guías, tutoriales y soporte.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayuda | MangaAura',
    description: 'Encuentra respuestas a tus preguntas sobre MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/help' },
};

export default function HelpPage(props: any) {
  return <HelpClient {...props} />;
}
