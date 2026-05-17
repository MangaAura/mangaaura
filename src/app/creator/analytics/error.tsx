'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreatorAnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en analíticas" message="No se pudieron cargar las analíticas." />;
}
