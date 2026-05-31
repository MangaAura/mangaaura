import type { Metadata } from 'next';

import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Mensajes de Contacto | MangaAura',
  description: 'Gestiona los mensajes de contacto de los usuarios.',
  robots: { index: false, follow: false },
};

export default function ContactPage(props: any) {
  return <ContactClient {...props} />;
}