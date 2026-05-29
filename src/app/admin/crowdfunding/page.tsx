import type { Metadata } from 'next';
import CrowdfundingClient from './CrowdfundingClient';

export const metadata: Metadata = {
  title: 'Crowdfunding | MangaAura',
  description: 'Gestiona las campañas de crowdfunding en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Crowdfunding | MangaAura',
    description: 'Gestiona las campañas de crowdfunding en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crowdfunding | MangaAura',
    description: 'Gestiona el crowdfunding en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/crowdfunding' },
};

export default function CrowdfundingPage(props: any) {
  return <CrowdfundingClient {...props} />;
}
