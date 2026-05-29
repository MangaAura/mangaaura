import type { Metadata } from 'next';
import AchievementManagementClient from './AchievementManagementClient';

export const metadata: Metadata = {
  title: 'Administrar Logros | MangaAura',
  description: 'Gestiona los logros y trofeos de la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Logros | MangaAura',
    description: 'Gestiona los logros y trofeos de la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Logros | MangaAura',
    description: 'Gestiona los logros de la plataforma MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/achievements' },
};

export default function AchievementManagementPage(props: any) {
  return <AchievementManagementClient {...props} />;
}
