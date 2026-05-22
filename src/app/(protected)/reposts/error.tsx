'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function RepostsError({
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
      title="Error al cargar reposts"
      message="No se pudieron cargar los reposts. Intenta de nuevo más tarde."
    />
  );
}
