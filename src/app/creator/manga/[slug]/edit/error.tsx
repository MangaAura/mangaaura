'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorMangaEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al editar manga" message="No se pudo guardar la edición del manga." />;
}
