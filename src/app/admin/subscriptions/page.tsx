import type { Metadata } from 'next';

import SubscriptionsClient from './SubscriptionsClient';

export const metadata: Metadata = {
  title: 'Suscripciones | MangaAura',
  description: 'Gestiona las suscripciones de usuarios en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Suscripciones | MangaAura',
    description: 'Gestiona las suscripciones de usuarios en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suscripciones | MangaAura',
    description: 'Gestiona las suscripciones en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/subscriptions' },
};

export default function SubscriptionsPage(props: any) {
  return <SubscriptionsClient {...props} />;
}
