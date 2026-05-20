import type { Metadata } from 'next';

import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';
import Navbar from '@/components/Layout/Navbar';

export const metadata: Metadata = {
  title: 'Mi Biblioteca | Inkverse',
  description: 'Tu biblioteca personal de mangas. Guarda y organiza tus mangas favoritos para leer después.',
};

export default function LibraryLayout({
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
