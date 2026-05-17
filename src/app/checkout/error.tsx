'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en el pago" message="Ocurrió un error al procesar tu compra." />;
}
