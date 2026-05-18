export default function BookmarksLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-1/4 bg-[var(--bg-tertiary)] rounded-lg mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-[var(--bg-tertiary)]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4" />
                <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
                <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
