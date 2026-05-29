import type { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Comprar Aura | MangaAura',
  description: 'Adquiere Aura, la moneda virtual de MangaAura, y apoya a tus creadores favoritos.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Comprar Aura | MangaAura',
    description: 'Adquiere Aura, la moneda virtual de MangaAura, y apoya a tus creadores favoritos.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comprar Aura | MangaAura',
    description: 'Adquiere Aura, la moneda virtual de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/checkout' },
};

export default function CheckoutPage(props: any) {
  return <CheckoutClient {...props} />;
}
