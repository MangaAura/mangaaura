'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar mensajes" message="Intenta de nuevo más tarde." />;
}
