'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function FeedError({
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
      title="Error al cargar el feed"
      message="No se pudo cargar tu feed de actividad. Intenta de nuevo más tarde."
    />
  );
}
