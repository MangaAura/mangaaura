'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function QuestsError({
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
      title="Error al cargar misiones"
      message="No se pudieron cargar las misiones. Intenta de nuevo más tarde."
    />
  );
}
