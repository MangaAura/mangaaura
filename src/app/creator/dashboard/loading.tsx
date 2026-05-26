export default function CreatorLoading() {
  return (
    <div role="status" className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-sunken)]" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-[var(--surface-sunken)] rounded-lg" />
            <div className="h-4 w-64 bg-[var(--surface-sunken)] rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] p-6 space-y-4">
              <div className="h-4 w-24 bg-[var(--surface-sunken)] rounded" />
              <div className="h-10 w-20 bg-[var(--surface-sunken)] rounded" />
              <div className="h-5 w-16 bg-[var(--surface-sunken)] rounded" />
            </div>
          ))}
        </div>
        <div className="h-5 w-32 bg-[var(--surface-sunken)] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] aspect-[3/4]" />
          ))}
        </div>
      </div>
    </div>
  );
}
