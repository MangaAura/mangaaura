import { Metadata } from 'next';

import EditCollectionClient from './EditCollectionClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditCollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.collectionsEdit.title');
  const description = t('page.collectionsEdit.description');

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
    alternates: { canonical: `/collections/${id}/edit` },
  };
}

export default function EditCollectionPage() {
  return <EditCollectionClient />;
}
