'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function BrowseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar" message="No se pudo cargar el contenido de exploración." />;
}
