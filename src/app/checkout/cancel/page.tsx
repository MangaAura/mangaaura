import type { Metadata } from 'next';
import CheckoutCancelClient from './CheckoutCancelClient';

export const metadata: Metadata = {
  title: 'Compra Cancelada | MangaAura',
  description: 'El proceso de compra de Aura en MangaAura ha sido cancelado.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Compra Cancelada | MangaAura',
    description: 'El proceso de compra de Aura en MangaAura ha sido cancelado.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compra Cancelada | MangaAura',
    description: 'Compra cancelada en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/checkout/cancel' },
};

export default function CheckoutCancelPage(props: any) {
  return <CheckoutCancelClient {...props} />;
}
