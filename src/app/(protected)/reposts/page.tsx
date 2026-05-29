import type { Metadata } from 'next';
import RepostsClient from './RepostsClient';

export const metadata: Metadata = {
  title: 'Reposts | MangaAura',
  description: 'Tus reposts y actividad reciente en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Reposts | MangaAura',
    description: 'Tus reposts y actividad reciente en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reposts | MangaAura',
    description: 'Tus reposts y actividad reciente en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/reposts' },
};

export default function RepostsPage(props: any) {
  return <RepostsClient {...props} />;
}
