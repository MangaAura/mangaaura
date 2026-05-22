export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse" role="status">
      {/* Search bar */}
      <div className="h-12 rounded-xl bg-[var(--surface-elevated)] max-w-2xl mx-auto" />
      
      {/* Filter chips */}
      <div className="flex gap-2 justify-center">
        <div className="h-8 w-20 rounded-full bg-[var(--surface-elevated)]" />
        <div className="h-8 w-24 rounded-full bg-[var(--surface-elevated)]" />
        <div className="h-8 w-16 rounded-full bg-[var(--surface-elevated)]" />
        <div className="h-8 w-28 rounded-full bg-[var(--surface-elevated)]" />
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[3/4] rounded-lg bg-[var(--surface-elevated)]" />
            <div className="h-4 w-3/4 rounded bg-[var(--surface-elevated)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--surface-elevated)]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Buscando...</span>
    </div>
  );
}
