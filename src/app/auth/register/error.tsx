'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al registrarse" message="No se pudo completar el registro. Intenta de nuevo." />;
}
