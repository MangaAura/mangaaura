import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Notificaciones | Inkverse',
  description: 'Tus notificaciones de Inkverse. Mantente al día con actividad en tus mangas favoritos y comunidad.',
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
