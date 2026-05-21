'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminNewsError({
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
      title="Error al cargar noticias"
      message="No se pudieron cargar las noticias del panel de administración."
    />
  );
}
