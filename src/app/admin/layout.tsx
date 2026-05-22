import type { Metadata } from 'next';

import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Administración | MangaAura',
  description: 'Panel de administración de MangaAura',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      requireAuth
      allowedRoles={['ADMIN']}
      sidebar={<AdminSidebar />}
      sidebarContentClass="lg:ml-64"
    >
      <div className="p-4 lg:p-8">{children}</div>
    </AppShell>
  );
}
