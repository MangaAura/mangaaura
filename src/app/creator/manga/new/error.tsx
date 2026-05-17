'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorMangaNewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al crear manga" message="No se pudo crear el manga. Intenta de nuevo." />;
}
