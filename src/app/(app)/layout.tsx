import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { SkipToContent } from '@/components/Layout/SkipToContent';

const Navbar = dynamic(() => import('@/components/Layout/Navbar'), {
  ssr: true,
});

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
      <SkipToContent />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<div className="h-screen animate-pulse bg-[var(--background)]" />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
