import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Manga | MangaAura',
  description: 'Lee manga en MangaAura. Miles de títulos de manga en español con capítulos actualizados daily.',
};

export default function MangaLayout({
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
