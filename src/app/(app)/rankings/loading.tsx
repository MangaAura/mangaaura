export default function RankingsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] animate-pulse">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="h-8 w-1/3 bg-[var(--surface-sunken)] rounded-lg mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="w-8 h-8 bg-[var(--surface-sunken)] rounded-full" />
              <div className="w-10 h-10 bg-[var(--surface-sunken)] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--surface-sunken)] rounded w-1/3" />
                <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/4" />
              </div>
              <div className="h-6 bg-[var(--surface-sunken)] rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
