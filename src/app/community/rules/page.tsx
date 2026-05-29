import type { Metadata } from 'next';
import CommunityRulesClient from './CommunityRulesClient';

export const metadata: Metadata = {
  title: 'Reglas de la Comunidad | MangaAura',
  description: 'Conoce las reglas y normas de convivencia de la comunidad MangaAura.',
  openGraph: {
    title: 'Reglas de la Comunidad | MangaAura',
    description: 'Conoce las reglas y normas de convivencia de la comunidad MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reglas de la Comunidad | MangaAura',
    description: 'Reglas de la comunidad MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/community/rules' },
};

export default function CommunityRulesPage(props: any) {
  return <CommunityRulesClient {...props} />;
}
