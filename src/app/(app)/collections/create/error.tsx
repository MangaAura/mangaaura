'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function CreateCollectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al crear colección" message="Intenta de nuevo más tarde." />;
}
