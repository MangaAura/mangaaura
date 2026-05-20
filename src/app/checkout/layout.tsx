import type { Metadata } from 'next';

import Navbar from '@/components/Layout/Navbar';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

export const metadata: Metadata = {
  title: 'Finalizar Compra | Inkverse',
  description: 'Completa tu compra de capítulos o manga en Inkverse de forma segura.',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--text-primary)] flex flex-col">
      <div role="region" aria-label="Skip navigation">
        <SkipToContent />
      </div>
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
