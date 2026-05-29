import type { Metadata } from 'next';
import ClanManagementClient from './ClanManagementClient';

export const metadata: Metadata = {
  title: 'Administrar Clanes | MangaAura',
  description: 'Gestiona los clanes y comunidades en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Clanes | MangaAura',
    description: 'Gestiona los clanes y comunidades en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Clanes | MangaAura',
    description: 'Gestiona los clanes en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/clans' },
};

export default function ClanManagementPage(props: any) {
  return <ClanManagementClient {...props} />;
}
