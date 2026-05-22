'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function BookmarksError({
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
      title="Error al cargar marcadores"
      message="No se pudieron cargar tus marcadores. Intenta de nuevo más tarde."
    />
  );
}
