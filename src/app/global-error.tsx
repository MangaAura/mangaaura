'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Error crítico
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Ocurrió un error inesperado en la aplicación.
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mb-8">
              {error.message}
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center px-6 py-2 rounded-lg font-medium bg-[var(--primary)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity"
            >
              Recargar página
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
