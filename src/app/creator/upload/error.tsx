'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorUploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al subir archivos" message="No se pudieron subir los archivos. Intenta de nuevo." />;
}
