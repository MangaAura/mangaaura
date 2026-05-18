'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AchievementDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <Link
        href="/achievements"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver a Logros
      </Link>
      <ErrorFallback error={error} reset={reset} />
    </div>
  );
}
