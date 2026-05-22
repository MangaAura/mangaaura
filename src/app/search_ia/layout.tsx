import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Explorar Mangas | MangaAura',
  description: 'Explora miles de mangas de todos los géneros. Filtra por género, estado, rating y más.',
};

export default function BrowseLayout({
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
