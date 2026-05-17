'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar biblioteca" message="No se pudo cargar tu biblioteca de mangas." />;
}
