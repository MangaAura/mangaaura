'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function UserProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Error al cargar perfil" message="Intenta de nuevo más tarde." />;
}
