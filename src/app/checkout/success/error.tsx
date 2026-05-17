'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CheckoutSuccessError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al confirmar la compra" message="No se pudo confirmar tu compra. Contacta a soporte si el cargo ya fue realizado." />;
}
