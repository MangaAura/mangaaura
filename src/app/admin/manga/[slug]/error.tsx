'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminMangaDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar el manga" message="No se pudo cargar la información del manga." />;
}
