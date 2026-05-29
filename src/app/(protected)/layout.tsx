import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { AppShell } from '@/components/Layout/AppShell';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const description = t('page.protectedLayout.description');

  return {
    description,
  };
}

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
