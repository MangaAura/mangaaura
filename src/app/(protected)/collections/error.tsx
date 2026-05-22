'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CollectionsError({
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
      title="Error al cargar colecciones"
      message="No se pudieron cargar las colecciones. Intenta de nuevo más tarde."
    />
  );
}
