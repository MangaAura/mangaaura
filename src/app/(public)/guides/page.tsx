import { Metadata } from 'next';

import { GuidesPageClient } from './GuidesPageClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.guias.title');
  const description = t('page.guias.description');

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: t('page.guiasOg.title'),
      description: t('page.guiasOg.description'),
      type: 'website',
      images: ['/og-image.png'],
    },
    ...withHreflang('/guides'),
  };
}

export default function GuidesPage() {
  return <GuidesPageClient />;
}
