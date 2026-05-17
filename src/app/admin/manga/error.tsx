'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminMangaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar mangas" message="No se pudieron cargar los mangas." />;
}
