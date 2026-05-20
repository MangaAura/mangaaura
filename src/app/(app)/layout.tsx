import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import type { Metadata } from 'next';

import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

const Navbar = dynamic(() => import('@/components/Layout/Navbar'), {
  ssr: true,
});

export const metadata: Metadata = {
  title: 'Inkverse',
  description: 'Plataforma de manga para creadores y lectores.',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
      <div role="region" aria-label="Skip navigation">
        <SkipToContent />
      </div>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<div className="h-screen animate-pulse bg-[var(--background)]" />}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </main>
    </div>
  );
}
