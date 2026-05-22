import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AIServiceDashboardClient } from './AIServiceDashboardClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'AI Dashboard | MangaAura',
  description: 'Panel de administración de servicios de IA para MangaAura.',
  robots: { index: false, follow: false },
};

// Server Component para verificación de autenticación
export default async function AIServiceDashboardPage() {
  const session = await auth();

  // Si no hay sesión, redirigir a login
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/ai-dashboard');
  }

  // Si no es admin, mostrar acceso denegado
  if (session.user.role !== 'ADMIN') {
    const locale = await detectLocale();
    const t = getT(locale);
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[var(--error)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('admin.accessDenied')}</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {t('admin.accessDeniedDesc')}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-[var(--primary-hover)] hover:opacity-90 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
          >
            {t('admin.goHome')}
          </Link>
        </div>
      </div>
    );
  }

  // Renderizar el cliente del dashboard si es admin
  return <AIServiceDashboardClient />;
}
