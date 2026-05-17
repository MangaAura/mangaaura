'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en el dashboard" message="No se pudo cargar el dashboard del creador." />;
}
