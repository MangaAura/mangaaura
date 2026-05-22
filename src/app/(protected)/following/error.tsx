'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function FollowingError({
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
      title="Error al cargar conexiones"
      message="No se pudieron cargar tus conexiones. Intenta de nuevo más tarde."
    />
  );
}
