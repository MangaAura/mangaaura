'use client';

export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-fg-primary mb-2">Error en el Lector</h2>
        <p className="text-fg-secondary mb-6">No se pudo cargar el capítulo. Intenta de nuevo.</p>
        <button
          onClick={reset}
          className="bg-[var(--primary)] text-[var(--text-inverse)] px-6 py-2 rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
