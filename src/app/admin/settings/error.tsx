'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en configuración" message="No se pudieron cargar las configuraciones." />;
}
