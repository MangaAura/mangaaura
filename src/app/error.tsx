'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Report to error tracking (Sentry)
    if (process.env.NODE_ENV === 'production') {
      import('@sentry/nextjs').then((sentry) => {
        sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
<div className="w-24 h-24 mx-auto bg-[var(--error)]/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-12 h-12 text-[var(--error)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
          ¡Ups! Algo salió mal
        </h1>

        {/* Message */}
        <p className="text-[var(--text-secondary)] text-lg mb-2">
          Ha ocurrido un error inesperado.
        </p>
        <p className="text-[var(--text-tertiary)] text-sm mb-8">
          No te preocupes, estamos trabajando para solucionarlo.
        </p>

        {/* Error details (only in development) */}
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

        {/* Actions */}
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

        {/* Help text */}
        <p className="mt-8 text-[var(--text-tertiary)] text-sm">
          Si el problema persiste, contacta con{' '}
          <Link href="/contact" className="text-[var(--primary)] hover:underline">
            soporte
          </Link>
          {' '}o intenta más tarde.
        </p>
      </div>
    </div>
  );
}
