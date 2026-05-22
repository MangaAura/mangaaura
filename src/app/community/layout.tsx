import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Comunidad | MangaAura',
  description: 'Únete a la comunidad de MangaAura. Participa en foros, crea clans y más.',
};

export default function CommunityLayout({
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
