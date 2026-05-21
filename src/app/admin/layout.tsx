import type { Metadata } from 'next';

import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

export const metadata: Metadata = {
  title: 'Administración | Inkverse',
  description: 'Panel de administración de Inkverse',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-[var(--background)]">
        <div role="region" aria-label="Skip navigation">
          <SkipToContent />
        </div>
        <AdminSidebar />
        <main id="main-content" className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
