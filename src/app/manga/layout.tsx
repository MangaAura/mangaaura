import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Manga | Inkverse',
  description: 'Lee manga en Inkverse. Miles de títulos de manga en español con capítulos actualizados daily.',
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
