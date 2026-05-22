import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Autenticación | Inkverse',
  description: 'Inicia sesión o regístrate en Inkverse.',
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
