'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminUserDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar usuario" message="No se pudo cargar la información del usuario." />;
}
