'use client';

export default function CreateCollectionError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8" role="alert">
      <h2 className="text-2xl font-bold">Error al crear colección</h2>
      <p className="text-muted-foreground">{error.message || 'Intenta de nuevo más tarde.'}</p>
      <button onClick={reset} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
        Intentar de nuevo
      </button>
    </div>
  );
}
