'use client';

import { ErrorState } from '@/components/ui/EmptyState';

export default function ClanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <ErrorState
        message={error.message || 'Error al cargar la página del clan'}
        onRetry={reset}
      />
    </div>
  );
}
