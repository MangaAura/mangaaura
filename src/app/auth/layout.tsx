import type { Metadata } from 'next';

import Navbar from '@/components/Layout/Navbar';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

export const metadata: Metadata = {
  title: 'Autenticación | Inkverse',
  description: 'Inicia sesión o regístrate en Inkverse.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--text-primary)]">
      <div role="region" aria-label="Skip navigation">
        <SkipToContent />
      </div>
      <Navbar />
      <main id="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
