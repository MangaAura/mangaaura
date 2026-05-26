'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { NoIndex } from '@/components/SEO/NoIndex';

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
