import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Notificaciones | MangaAura',
  description: 'Tus notificaciones de MangaAura. Mantente al día con actividad en tus mangas favoritos y comunidad.',
};

export default function NotificationsLayout({
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
