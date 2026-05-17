'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al iniciar sesión" />;
}
