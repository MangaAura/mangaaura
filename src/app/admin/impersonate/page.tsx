import type { Metadata } from 'next';

import ImpersonateClient from './ImpersonateClient';

export const metadata: Metadata = {
  title: 'Suplantar Usuario | MangaAura',
  description: 'Herramienta de administración para suplantar usuarios en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Suplantar Usuario | MangaAura',
    description: 'Herramienta de administración para suplantar usuarios en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suplantar Usuario | MangaAura',
    description: 'Herramienta de admin para suplantar usuarios en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/impersonate' },
};

export default function ImpersonatePage(props: any) {
  return <ImpersonateClient {...props} />;
}
