import { Metadata } from 'next';

import EditChapterClient from './EditChapterClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.creatorChapterEdit.title');
  const description = t('page.creatorChapterEdit.description');

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
    alternates: { canonical: '/creator/manga/[slug]/chapter/[chapterNumber]/edit' },
  };
}

export default function EditChapterPage(props: any) {
  return <EditChapterClient {...props} />;
}
