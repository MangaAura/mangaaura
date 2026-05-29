import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conversación | MangaAura',
  description: 'Conversación privada en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Conversación | MangaAura',
    description: 'Conversación privada en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conversación | MangaAura',
    description: 'Conversación privada en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/messages/[id]' },
};

export default async function ConversationPage() {
  redirect('/messages');
}
