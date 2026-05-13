'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PromptsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Prompts error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto bg-[var(--error)]/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Error al cargar Prompts
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          No se pudieron cargar los prompts. Intenta de nuevo más tarde.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center px-6 py-2 rounded-lg font-medium bg-[var(--primary)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2 rounded-lg font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
