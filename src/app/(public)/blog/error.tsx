'use client';

export default function BlogError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6">
      <h2 className="text-2xl font-bold">Error al cargar el blog</h2>
      <p className="text-fg-secondary text-center max-w-md">
        {error.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.'}
      </p>
      <button onClick={() => reset()} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
        Reintentar
      </button>
    </div>
  );
}
