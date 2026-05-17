'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function PromptsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar Prompts" message="No se pudieron cargar los prompts. Intenta de nuevo más tarde." />;
}
