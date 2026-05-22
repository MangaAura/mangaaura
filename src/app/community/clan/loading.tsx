export default function ClanLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pulse" role="status">
      {/* Hero skeleton */}
      <div className="h-48 rounded-xl bg-[var(--surface-elevated)]" />
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-[var(--surface-elevated)]" />
        ))}
      </div>

      {/* Members list */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-[var(--surface-elevated)]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--surface-elevated)]" />
        ))}
      </div>
      <span className="sr-only">Cargando clan...</span>
    </div>
  );
}
