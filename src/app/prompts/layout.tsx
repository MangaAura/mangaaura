import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'Prompts de IA | MangaAura',
  description: 'Crea y descubre prompts de IA para generar imágenes de estilo manga. Usa prompts de la comunidad o crea los tuyos.',
};

export default function PromptsLayout({
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
