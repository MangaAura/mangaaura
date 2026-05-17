'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ForgotPasswordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al recuperar contraseña" message="No se pudo procesar tu solicitud. Intenta de nuevo." />;
}
