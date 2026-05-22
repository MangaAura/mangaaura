import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Buscar Mangas | MangaAura',
  description: 'Busca miles de mangas por título, autor, género o etiquetas. Encuentra tu próximo manga favorito en MangaAura.',
};

export default function SearchLayout({
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
