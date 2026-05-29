import type { Metadata } from 'next';
import SignupAnalyticsClient from './SignupAnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics de Registro | MangaAura',
  description: 'Estadísticas detalladas del proceso de registro de usuarios en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Analytics de Registro | MangaAura',
    description: 'Estadísticas del proceso de registro de usuarios en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics de Registro | MangaAura',
    description: 'Estadísticas de registro en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/analytics/signup' },
};

export default function SignupAnalyticsPage(props: any) {
  return <SignupAnalyticsClient {...props} />;
}
