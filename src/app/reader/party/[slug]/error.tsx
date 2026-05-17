'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ReaderPartyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error en lectura grupal" message="No se pudo cargar la sesión de lectura grupal." />;
}
