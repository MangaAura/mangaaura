'use client';

import { ErrorState } from '@/components/ui/EmptyState';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <ErrorState
        message={error.message || 'Error al realizar la búsqueda'}
        onRetry={reset}
      />
    </div>
  );
}
