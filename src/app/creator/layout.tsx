import type { Metadata } from 'next';

import { Sidebar } from '@/components/Creator/Sidebar';
import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Panel de Creador | Inkverse',
  description: 'Gestiona tu contenido como creador en Inkverse. Sube capítulos, edita información de manga y más.',
  robots: { index: false, follow: false },
};

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      requireAuth
      sidebar={<Sidebar className="hidden lg:flex fixed left-0 top-0 h-screen z-50" />}
      sidebarContentClass="lg:ml-64"
    >
      {children}
    </AppShell>
  );
}
