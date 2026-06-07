import { Metadata } from 'next';

import { GenerateImageClient } from './GenerateImageClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('creator.imageGeneration.metaTitle');
  const description = t('creator.imageGeneration.metaDescription');

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
    alternates: { canonical: '/creator/ai/generate' },
  };
}

export default async function GenerateImagePage() {
  // Fetch the real aura balance server-side so the client never flashes 0
  let initialAuraBalance = 0;
  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { auraBalance: true },
      });
      initialAuraBalance = user?.auraBalance ?? 0;
    }
  } catch {
    // Fallback to 0 if auth/DB fails on the server
    initialAuraBalance = 0;
  }

  return <GenerateImageClient initialAuraBalance={initialAuraBalance} />;
}
