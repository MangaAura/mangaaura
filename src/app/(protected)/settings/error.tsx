'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function SettingsError({
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
      title="Error al cargar configuración"
      message="No se pudieron cargar tus ajustes. Intenta de nuevo más tarde."
    />
  );
}
