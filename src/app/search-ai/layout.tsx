import { AppShell } from '@/components/Layout/AppShell';

export default function BrowseLayout({
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
