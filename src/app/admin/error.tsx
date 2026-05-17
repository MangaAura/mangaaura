'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <ErrorFallback error={error} reset={reset} title="Error en el Panel de Administración" message="Ha ocurrido un error en el panel admin. Intenta de nuevo." />
    </div>
  );
}
