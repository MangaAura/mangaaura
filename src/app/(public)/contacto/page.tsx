import type { Metadata } from 'next';
import ContactoClient from './ContactoClient';

export const metadata: Metadata = {
  title: 'Contacto | MangaAura',
  description: 'Ponte en contacto con el equipo de MangaAura. Estamos aquí para ayudarte.',
  openGraph: {
    title: 'Contacto | MangaAura',
    description: 'Ponte en contacto con el equipo de MangaAura. Estamos aquí para ayudarte.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto | MangaAura',
    description: 'Ponte en contacto con el equipo de MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage(props: any) {
  return <ContactoClient {...props} />;
}
