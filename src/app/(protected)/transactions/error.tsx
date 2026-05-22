'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function TransactionsError({
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
      title="Error al cargar transacciones"
      message="No se pudieron cargar tus transacciones. Intenta de nuevo más tarde."
    />
  );
}
