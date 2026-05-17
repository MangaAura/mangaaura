'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function MangaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <ErrorFallback error={error} reset={reset} title="Error al cargar el manga" message="No se pudo cargar la información de este manga. Intenta de nuevo." />
    </div>
  );
}
