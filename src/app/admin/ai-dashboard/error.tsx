'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminAIDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en el Dashboard de IA" message="No se pudieron cargar los datos del dashboard de IA." />;
}
