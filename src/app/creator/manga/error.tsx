'use client';

export default function MyMangaError() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-500 font-medium">Error al cargar tus mangas. Intenta de nuevo más tarde.</p>
        </div>
      </div>
    </div>
  );
}
