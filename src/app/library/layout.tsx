import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Mi Biblioteca | MangaAura',
  description: 'Tu biblioteca personal de mangas. Guarda y organiza tus mangas favoritos para leer después.',
};

export default function LibraryLayout({
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
