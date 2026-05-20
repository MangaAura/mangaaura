import type { Metadata } from 'next';

import Navbar from '@/components/Layout/Navbar';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';

export const metadata: Metadata = {
  title: 'Comunidad | Inkverse',
  description: 'Únete a la comunidad de Inkverse. Participa en foros, crea clans y más.',
};

export default function CommunityLayout({
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
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
