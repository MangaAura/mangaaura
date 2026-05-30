import type { Metadata } from 'next';

import EmailTemplatesClient from './EmailTemplatesClient';

export const metadata: Metadata = {
  title: 'Plantillas de Email | MangaAura',
  description: 'Gestiona las plantillas de correo electrónico de MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Plantillas de Email | MangaAura',
    description: 'Gestiona las plantillas de correo electrónico de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plantillas de Email | MangaAura',
    description: 'Gestiona las plantillas de email de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/email-templates' },
};

export default function EmailTemplatesPage(props: any) {
  return <EmailTemplatesClient {...props} />;
}
