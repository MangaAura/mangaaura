export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-10 w-64 bg-[var(--surface-sunken)] rounded-lg mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl" />
            <div className="h-4 w-3/4 bg-[var(--surface-sunken)] rounded" />
            <div className="h-3 w-1/2 bg-[var(--surface-sunken)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
