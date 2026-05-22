import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Perfil | MangaAura',
  description: 'Perfil de usuario en MangaAura. Consulta actividad, estadísticas y ajustes de cuenta.',
};

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell showMobileBottomNav>
      {children}
    </AppShell>
  );
}
