'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-6">
      <ErrorFallback error={error} reset={reset} title="Error en el Lector" message="No se pudo cargar el capítulo. Intenta de nuevo." />
    </main>
  );
}
