'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreateThreadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al crear el hilo" message="Intenta de nuevo más tarde." />;
}
