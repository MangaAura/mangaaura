'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ClansListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Clans list error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto bg-[var(--error)]/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Error al cargar clanes
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          No se pudo cargar la lista de clanes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="bg-[var(--primary)] hover:opacity-90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/community">Volver a comunidad</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
