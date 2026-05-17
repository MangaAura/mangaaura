'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ClansCreateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al crear clan" message="No se pudo crear el clan. Inténtalo de nuevo." />;
}
