import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { Sidebar } from '@/components/Creator/Sidebar';
import { AppShell } from '@/components/Layout/AppShell';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const description = t('page.creatorLayout.description');

  return {
    description,
    robots: { index: false, follow: false },
  };
}

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      requireAuth
      showNavbarWithSidebar
      sidebar={<Sidebar className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] z-50" />}
      sidebarContentClass="lg:ml-64 pt-16"
    >
      {children}
    </AppShell>
  );
}
