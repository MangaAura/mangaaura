import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Autenticación | MangaAura',
  description: 'Inicia sesión o regístrate en MangaAura.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell mobileBottomPadding={false}>
      {children}
    </AppShell>
  );
}
