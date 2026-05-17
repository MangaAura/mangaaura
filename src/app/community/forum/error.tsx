'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ForumError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en el foro" message="No se pudieron cargar las publicaciones del foro." />;
}
