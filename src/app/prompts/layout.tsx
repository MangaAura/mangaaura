import { AppShell } from '@/components/Layout/AppShell';

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
