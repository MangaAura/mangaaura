'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ForumThreadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar el hilo" message="Ocurrió un error al cargar este hilo del foro. Por favor, intenta de nuevo." />;
}
