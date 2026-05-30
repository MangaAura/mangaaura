'use client';

export function ErrorFallback({
  error,
  reset,
  title = 'Algo salió mal',
  message = 'Ocurrió un error inesperado. Intenta de nuevo.',
  showReset = true,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  message?: string;
  showReset?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-[var(--text-muted)] text-sm text-center max-w-md">{message}</p>
      {error?.digest && (
        <p className="text-xs text-[var(--text-muted)] font-mono">Error ID: {error.digest}</p>
      )}
      {showReset && reset && (
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-[#4f46e5] text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
