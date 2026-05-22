'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function TipsError({
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
      title="Error al cargar propinas"
      message="No se pudieron cargar tus propinas. Intenta de nuevo más tarde."
    />
  );
}
