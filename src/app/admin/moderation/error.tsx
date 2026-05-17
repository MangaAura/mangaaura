'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminModerationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en moderación" message="No se pudieron cargar los elementos de moderación." />;
}
