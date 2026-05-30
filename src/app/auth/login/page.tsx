import { Metadata } from 'next';

import LoginClient from './LoginClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';


export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.authLogin.title');
  const description = t('page.authLogin.description');

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
    alternates: { canonical: '/auth/login' },
  };
}

export default function LoginPage(props: any) {
  return <LoginClient {...props} />;
}
