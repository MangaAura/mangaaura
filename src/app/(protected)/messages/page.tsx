import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MessagesPageClient } from './MessagesPageClient';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Mensajes | MangaAura',
  description: 'Tus conversaciones y mensajes directos',
};

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages');
  }

  return <MessagesPageClient userId={session.user.id} />;
}
