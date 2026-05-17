'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function BrowseSearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en la búsqueda" message="No se pudieron cargar los resultados de búsqueda." />;
}
