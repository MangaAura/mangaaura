import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { MobileBottomNav } from '@/components/Layout/MobileBottomNav';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

const Navbar = dynamic(() => import('@/components/Layout/Navbar'), {
  ssr: true,
});

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
      <SkipToContent />
      <Navbar />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<div className="h-screen animate-pulse bg-[var(--background)]" />}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </main>
      <MobileBottomNav />
    </div>
  );
}
