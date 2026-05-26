import type { Metadata } from 'next';

import { Sidebar } from '@/components/Creator/Sidebar';
import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Panel de Creador | MangaAura',
  description: 'Gestiona tu contenido como creador en MangaAura. Sube capítulos, edita información de manga y más.',
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
      showNavbarWithSidebar
      sidebar={<Sidebar className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] z-50" />}
      sidebarContentClass="lg:ml-64 pt-16"
    >
      {children}
    </AppShell>
  );
}
