import type { Metadata } from 'next';

import { AppShell } from '@/components/Layout/AppShell';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);

  return {
    title: {
      default: t('page.publicLayout.title'),
      template: '%s | MangaAura',
    },
    description: t('page.publicLayout.description'),
  };
}

export default function PublicLayout({
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
