import { Metadata } from 'next';
import { Suspense } from 'react';

import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

import CompleteRegistrationClient from './CompleteRegistrationClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  return {
    title: t('auth.completeRegistration.title'),
    description: t('auth.completeRegistration.description'),
  };
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <CompleteRegistrationClient />
    </Suspense>
  );
}
