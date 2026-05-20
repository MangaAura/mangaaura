import type { Metadata } from 'next';

import Navbar from '@/components/Layout/Navbar';
import { PageTransition } from '@/components/ui/PageTransition';
import { SkipToContent } from '@/components/Layout/SkipToContent';

export const metadata: Metadata = {
  title: 'Analíticas | Inkverse',
  description: 'Estadísticas detalladas de tu actividad de lectura y preferencias en Inkverse.',
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary flex flex-col">
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
