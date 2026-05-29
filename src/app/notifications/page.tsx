import type { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
  title: 'Notificaciones | MangaAura',
  description: 'Revisa tus notificaciones y actividad reciente en MangaAura.',
  openGraph: {
    title: 'Notificaciones | MangaAura',
    description: 'Revisa tus notificaciones y actividad reciente en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notificaciones | MangaAura',
    description: 'Revisa tus notificaciones en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/notifications' },
};

export default function NotificationsPage(props: any) {
  return <NotificationsClient {...props} />;
}
