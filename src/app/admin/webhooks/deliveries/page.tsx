import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DeliveriesClient } from './DeliveriesClient';
import { AdminAccessDenied } from '@/components/Admin/AdminAccessDenied';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Entregas de Webhooks | Admin | MangaAura',
  description: 'Historial de entregas de webhooks salientes.',
  robots: { index: false, follow: false },
};

export default async function WebhookDeliveriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/webhooks/deliveries');
  }

  if (!['ADMIN', 'OWNER'].includes(session.user.role as string)) {
    return <AdminAccessDenied />;
  }

  return <DeliveriesClient />;
}
