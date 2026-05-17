'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ClanDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar el clan" message="No se pudo cargar la información del clan. Puede que no exista o haya sido eliminado." />;
}
