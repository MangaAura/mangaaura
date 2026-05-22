'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ReadingHistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar historial de lectura"
      message="No se pudo cargar tu historial de lectura. Intenta de nuevo más tarde."
    />
  );
}
