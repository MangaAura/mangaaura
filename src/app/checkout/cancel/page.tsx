import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import CheckoutCancelClient from './CheckoutCancelClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.checkoutCancel.title');
  const description = t('page.checkoutCancel.description');

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
    alternates: { canonical: '/checkout/cancel' },
  };
}

export default function CheckoutCancelPage(props: any) {
  return <CheckoutCancelClient {...props} />;
}
