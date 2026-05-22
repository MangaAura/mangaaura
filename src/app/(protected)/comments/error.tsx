'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CommentsError({
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
      title="Error al cargar comentarios"
      message="No se pudieron cargar tus comentarios. Intenta de nuevo más tarde."
    />
  );
}
