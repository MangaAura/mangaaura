'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ExploreError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-[var(--error)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Error al cargar exploración</h2>
      <p className="text-[var(--text-secondary)] mb-6 max-w-md">
        {error.message || 'Ocurrió un error inesperado. Intenta de nuevo.'}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}
