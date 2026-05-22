'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ProfileError({
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
      title="Error al cargar tu perfil"
      message="No se pudieron cargar los datos de tu perfil. Intenta de nuevo más tarde."
    />
  );
}
