'use client';

import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--accent-red)]/10 px-4">
          <div className="max-w-lg w-full text-center animate-ac-fade-in-up">
            {/* Error Illustration */}
            <div className="mb-8 relative animate-ac-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-32 h-32 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-red)]/20 to-[var(--accent-orange)]/20 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="w-16 h-16 text-[var(--accent-red)]" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 animate-ac-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Algo salió mal
            </h1>

            {/* Description */}
            <p className="text-[var(--text-secondary)] text-lg mb-2 animate-ac-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Ocurrió un error inesperado en la aplicación.
            </p>
            <p className="text-[var(--text-tertiary)] mb-8 animate-ac-fade-in-up" style={{ animationDelay: '0.35s' }}>
              No te preocupes, no es tu culpa. Puedes intentar recargar la página.
            </p>

            {/* Error details (only shown for debugging) */}
            {error.digest && (
              <div className="bg-[var(--surface)]/50 rounded-xl p-4 mb-8 border border-[var(--border)] animate-ac-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <p className="text-xs text-[var(--text-tertiary)] font-mono">
                  ID de error: {error.digest}
                </p>
                {error.message && (
                  <p className="text-xs text-[var(--text-tertiary)] font-mono mt-1 break-all">
                    {error.message}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-ac-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </button>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </Link>
            </div>

            {/* Help link */}
            <p className="mt-8 text-[var(--text-tertiary)] text-sm animate-ac-fade-in-up" style={{ animationDelay: '0.6s' }}>
              ¿El error persiste?{' '}
              <Link href="/contact" className="text-[var(--primary)] hover:underline">
                Contacta con soporte
              </Link>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
