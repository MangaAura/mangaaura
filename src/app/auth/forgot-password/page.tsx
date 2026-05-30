import { Metadata } from 'next';

import ForgotPasswordClient from './ForgotPasswordClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.authForgotPassword.title');
  const description = t('page.authForgotPassword.description');

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: { canonical: '/auth/forgot-password' },
  };
}

export default function ForgotPasswordPage(props: any) {
  return <ForgotPasswordClient {...props} />;
}
