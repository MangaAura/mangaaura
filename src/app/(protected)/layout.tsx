import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Inkverse',
  description: 'Plataforma de manga para creadores y lectores.',
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell requireAuth showMobileBottomNav>
      {children}
    </AppShell>
  );
}
