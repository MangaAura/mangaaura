export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-40 bg-[var(--surface-sunken)] rounded-lg mb-6" />
        <div className="flex gap-3 mb-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-[var(--surface-sunken)] rounded-lg flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
