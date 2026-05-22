import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Buscar Mangas | Inkverse',
  description: 'Busca miles de mangas por título, autor, género o etiquetas. Encuentra tu próximo manga favorito en Inkverse.',
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
