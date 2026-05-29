import type { Metadata } from 'next';
import ContactClient from './ContactClient';

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
  alternates: { canonical: '/contact' },
};

export default function ContactPage(props: any) {
  return <ContactClient {...props} />;
}
