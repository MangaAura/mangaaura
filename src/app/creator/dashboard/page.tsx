import type { Metadata } from 'next';
import CreatorDashboardClient from './CreatorDashboardClient';

export const metadata: Metadata = {
  title: 'Panel del Creador | MangaAura',
  description: 'Panel de control para creadores en MangaAura. Gestiona tus mangas y capítulos.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Panel del Creador | MangaAura',
    description: 'Panel de control para creadores en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Panel del Creador | MangaAura',
    description: 'Panel de control para creadores en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/dashboard' },
};

export default function CreatorDashboardPage(props: any) {
  return <CreatorDashboardClient {...props} />;
}
