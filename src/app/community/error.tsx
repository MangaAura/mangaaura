'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en la comunidad" message="No se pudo cargar el contenido de la comunidad." />;
}
