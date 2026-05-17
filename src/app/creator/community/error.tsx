'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorCommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar el foro" message="No se pudo cargar la comunidad del creador." />;
}
