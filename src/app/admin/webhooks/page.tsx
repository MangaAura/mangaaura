import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { WebhooksClient } from './WebhooksClient';
import { AdminAccessDenied } from '@/components/Admin/AdminAccessDenied';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Webhooks | Admin | MangaAura',
  description: 'Gestiona los webhooks salientes de MangaAura.',
  robots: { index: false, follow: false },
};

export default async function WebhooksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/webhooks');
  }

  if (!['ADMIN', 'OWNER'].includes(session.user.role as string)) {
    return <AdminAccessDenied />;
  }

  return <WebhooksClient />;
}
