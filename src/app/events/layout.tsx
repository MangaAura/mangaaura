import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Eventos | MangaAura',
  description: 'Participa en eventos especiales, sorteos y promociones en MangaAura.',
};

export default function EventsLayout({
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
