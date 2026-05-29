import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import CreatorDashboardClient from './CreatorDashboardClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.creatorDashboard.title');
  const description = t('page.creatorDashboard.description');

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
    alternates: { canonical: '/creator/dashboard' },
  };
}

export default function CreatorDashboardPage(props: any) {
  return <CreatorDashboardClient {...props} />;
}
