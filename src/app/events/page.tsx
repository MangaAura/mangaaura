import { Metadata } from 'next';

import EventsPageContent from './EventsPageContent';

import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.events.title');

  return {
    title,
  };
}

export default function EventsPage() {
  return <EventsPageContent />;
}
