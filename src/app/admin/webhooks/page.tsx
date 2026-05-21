import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { WebhooksClient } from './WebhooksClient';

export const metadata: Metadata = {
  title: 'Webhooks | Admin | Inkverse',
  description: 'Gestiona los webhooks salientes de InkVerse.',
  robots: { index: false, follow: false },
};

export default async function WebhooksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/webhooks');
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Acceso Denegado</h1>
          <p className="text-[var(--text-secondary)] mb-6">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return <WebhooksClient />;
}
