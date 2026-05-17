'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CheckoutCancelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cancelar la compra" message="Ocurrió un error al procesar la cancelación." />;
}
