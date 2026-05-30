'use client';

import { NoIndex } from '@/components/SEO/NoIndex';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <NoIndex />
      <ErrorFallback error={error} reset={reset} />
    </>
  );
}
