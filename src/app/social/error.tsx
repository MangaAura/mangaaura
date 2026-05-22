'use client';

import { ErrorState } from '@/components/ui/EmptyState';

export default function SocialError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <ErrorState
        message={error.message || 'Error al cargar la página social'}
        onRetry={reset}
      />
    </div>
  );
}
