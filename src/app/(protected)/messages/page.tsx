import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MessagesPageClient } from './MessagesPageClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.messages.title');
  const description = t('page.messages.description');

  return {
    title,
    description,
  };
}

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages');
  }

  return <MessagesPageClient userId={session.user.id} />;
}
