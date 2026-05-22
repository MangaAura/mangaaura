'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CorrectionsError({
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
      title="Error al cargar correcciones"
      message="No se pudieron cargar tus correcciones. Intenta de nuevo más tarde."
    />
  );
}
