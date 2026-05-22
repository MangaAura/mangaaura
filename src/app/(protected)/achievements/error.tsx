'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AchievementsError({
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
      title="Error al cargar logros"
      message="No se pudieron cargar los logros. Intenta de nuevo más tarde."
    />
  );
}
