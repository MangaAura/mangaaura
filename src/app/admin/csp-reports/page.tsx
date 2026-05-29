import type { Metadata } from 'next';
import CspReportsClient from './CspReportsClient';

export const metadata: Metadata = {
  title: 'Informes CSP | MangaAura',
  description: 'Revisa los informes de Content Security Policy de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Informes CSP | MangaAura',
    description: 'Revisa los informes de Content Security Policy de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Informes CSP | MangaAura',
    description: 'Revisa los informes CSP de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/csp-reports' },
};

export default function CspReportsPage(props: any) {
  return <CspReportsClient {...props} />;
}
