import { AppShell } from '@/components/Layout/AppShell';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell showMobileBottomNav requireAuth>
      {children}
    </AppShell>
  );
}
