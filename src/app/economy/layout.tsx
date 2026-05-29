import { AppShell } from '@/components/Layout/AppShell';

export default function EconomyLayout({
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
