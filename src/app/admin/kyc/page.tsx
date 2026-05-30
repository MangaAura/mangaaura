import type { Metadata } from 'next';

import KYCClient from './KYCClient';

export const metadata: Metadata = {
  title: 'Verificación KYC | MangaAura',
  description: 'Revisa y gestiona las solicitudes de verificación KYC en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Verificación KYC | MangaAura',
    description: 'Revisa y gestiona las solicitudes de verificación KYC en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verificación KYC | MangaAura',
    description: 'Gestiona las solicitudes KYC en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/kyc' },
};

export default function KYCPage(props: any) {
  return <KYCClient {...props} />;
}
