import type { Metadata } from 'next';

import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';
import Navbar from '@/components/Layout/Navbar';

export const metadata: Metadata = {
  title: 'Mi Perfil | Inkverse',
  description: 'Tu perfil de usuario en Inkverse. Consulta tu actividad, estadísticas y ajustes de cuenta.',
};

export default function UserLayout({
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
