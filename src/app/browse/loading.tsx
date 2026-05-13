export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-1/3 bg-[var(--surface-sunken)] rounded-lg mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl" />
              <div className="h-4 bg-[var(--surface-sunken)] rounded w-3/4" />
              <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
