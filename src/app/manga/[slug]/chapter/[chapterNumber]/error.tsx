'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ChapterReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar el capítulo" message="No se pudo cargar este capítulo." />;
}
