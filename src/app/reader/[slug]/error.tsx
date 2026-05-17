'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ReaderSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en el lector" message="No se pudo cargar el contenido del lector." />;
}
