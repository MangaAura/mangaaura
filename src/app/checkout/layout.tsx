import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Finalizar Compra | MangaAura',
  description: 'Completa tu compra de capítulos o manga en MangaAura de forma segura.',
};

export default function CheckoutLayout({
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
