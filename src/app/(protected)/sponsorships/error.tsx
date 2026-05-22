'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function SponsorshipsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar patrocinios"
      message="No se pudieron cargar los patrocinios. Intenta de nuevo más tarde."
    />
  );
}
