import type { Metadata } from 'next';

import { Sidebar } from '@/components/Creator/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

export const metadata: Metadata = {
  title: 'Panel de Creador | Inkverse',
  description: 'Gestiona tu contenido como creador en Inkverse. Sube capítulos, edita información de manga y más.',
  robots: { index: false, follow: false },
};

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[var(--surface)]">
        <div role="region" aria-label="Skip navigation">
          <SkipToContent />
        </div>
        <Sidebar className="hidden lg:flex fixed left-0 top-0 h-screen z-50" />
        <main id="main-content" className="flex-1 lg:ml-64">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </AuthGuard>
  );
}
