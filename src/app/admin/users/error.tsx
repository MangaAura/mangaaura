'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminUsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar usuarios" message="No se pudieron cargar los usuarios." />;
}
