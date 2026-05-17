'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ClansListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar clanes" message="No se pudo cargar la lista de clanes." />;
}
