'use client';

import Link from 'next/link';

import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="max-w-md w-full text-center">
        <ErrorFallback error={error} reset={reset} title="Error de autenticación" message="Ocurrió un error con la autenticación." />
        <div className="mt-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center px-6 py-2 rounded-lg font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
