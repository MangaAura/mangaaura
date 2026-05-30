'use client';

import { RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { NoIndex } from '@/components/SEO/NoIndex';
import { Button } from '@/components/ui/Button';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'production') {
      import('@sentry/nextjs').then((sentry) => {
        sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <>
      <NoIndex />
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="max-w-lg w-full text-center">
        <ErrorFallback error={error} reset={reset} showReset={false} />

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 text-left">
            <div className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 text-[var(--warning)] mb-2">
                <Bug className="w-4 h-4" />
                <span className="text-sm font-medium">Detalles del error</span>
              </div>
              <pre className="text-xs text-[var(--text-secondary)] overflow-auto max-h-32 whitespace-pre-wrap">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:opacity-90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-[var(--text-tertiary)] text-sm">
          Si el problema persiste, contacta con{' '}
          <Link href="/contact" className="text-[var(--primary)] hover:underline">
            soporte
          </Link>
          {' '}o intenta más tarde.
        </p>
      </div>
    </div>
    </>
  );
}
