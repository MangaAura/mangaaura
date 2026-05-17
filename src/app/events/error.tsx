'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar eventos" message="No se pudieron cargar los eventos. Intenta de nuevo más tarde." />;
}
