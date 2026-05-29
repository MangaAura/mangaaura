import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat de Clán | MangaAura',
  description: 'Chat en vivo para tu clán en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Chat de Clán | MangaAura',
    description: 'Chat en vivo para tu clán en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chat de Clán | MangaAura',
    description: 'Chat en vivo para tu clán en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/messages/clan/[clanId]' },
};

export default async function ClanChatPage() {
  redirect('/messages');
}
