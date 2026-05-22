import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

import { AuthGuard } from '@/components/AuthGuard';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

const Navbar = dynamic(() => import('@/components/Layout/Navbar'), {
  ssr: true,
});
const MobileBottomNav = dynamic(() =>
  import('@/components/Layout/MobileBottomNav').then((m) => ({
    default: m.MobileBottomNav,
  })),
  { ssr: true },
);

export interface AppShellProps {
  children: ReactNode;
  /** Wraps content in AuthGuard */
  requireAuth?: boolean;
  /** Restrict access to specific roles (requires requireAuth) */
  allowedRoles?: string[];
  /** Show mobile bottom navigation bar */
  showMobileBottomNav?: boolean;
  /** Replace the top navbar with a sidebar (admin/creator layouts) */
  sidebar?: ReactNode;
  /** Extra class for main content sidebar offset (e.g., "lg:ml-64") */
  sidebarContentClass?: string;
  /** Extra class on the outer wrapper */
  className?: string;
  /** Render children directly without PageTransition wrapper */
  noPageTransition?: boolean;
  /** Whether to add pb-16 mobile padding (auto-enabled with showMobileBottomNav) */
  mobileBottomPadding?: boolean;
}

export async function AppShell({
  children,
  requireAuth,
  allowedRoles,
  showMobileBottomNav = false,
  sidebar,
  sidebarContentClass = '',
  className = '',
  noPageTransition = false,
  mobileBottomPadding,
}: AppShellProps) {
  // pb-16 is auto-enabled when showMobileBottomNav is true unless explicitly overridden
  const addMobilePadding = mobileBottomPadding ?? showMobileBottomNav;

  const mainContent = (
    <main
      id="main-content"
      className={`flex-1 ${addMobilePadding ? 'pb-16 md:pb-0' : ''} ${sidebarContentClass}`}
    >
      <Suspense
        fallback={<div className="h-screen animate-pulse bg-[var(--background)]" />}
      >
        {noPageTransition ? (
          children
        ) : (
          <PageTransition>{children}</PageTransition>
        )}
      </Suspense>
    </main>
  );

  // Sidebar layout: used by admin/creator (no top Navbar)
  if (sidebar) {
    const content = (
      <div className={`flex min-h-screen bg-[var(--surface)] ${className}`}>
        <div role="region" aria-label="Skip navigation">
          <SkipToContent />
        </div>
        {sidebar}
        {mainContent}
      </div>
    );

    if (requireAuth) {
      return <AuthGuard allowedRoles={allowedRoles}>{content}</AuthGuard>;
    }
    return content;
  }

  // Standard layout: Navbar at top, optional MobileBottomNav
  const content = (
    <div
      className={`min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col ${className}`}
    >
      <div role="region" aria-label="Skip navigation">
        <SkipToContent />
      </div>
      <Navbar />
      {mainContent}
      {showMobileBottomNav && <MobileBottomNav />}
    </div>
  );

  if (requireAuth) {
    return <AuthGuard allowedRoles={allowedRoles}>{content}</AuthGuard>;
  }

  return content;
}
