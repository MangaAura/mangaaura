import type { Metadata } from 'next';
import CheckoutSuccessClient from './CheckoutSuccessClient';

export const metadata: Metadata = {
  title: 'Compra Exitosa | MangaAura',
  description: 'Tu compra de Aura en MangaAura se ha completado con éxito.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Compra Exitosa | MangaAura',
    description: 'Tu compra de Aura en MangaAura se ha completado con éxito.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compra Exitosa | MangaAura',
    description: 'Compra exitosa de Aura en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/checkout/success' },
};

export default function CheckoutSuccessPage(props: any) {
  return <CheckoutSuccessClient {...props} />;
}
