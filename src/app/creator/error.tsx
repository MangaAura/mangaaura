'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <ErrorFallback error={error} reset={reset} title="Error en el Panel de Creador" message="Ha ocurrido un error al cargar tu panel. Intenta de nuevo." />
    </div>
  );
}
