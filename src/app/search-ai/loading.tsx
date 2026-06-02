export default function SearchAILoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-10 w-48 bg-[var(--surface-sunken)] rounded-lg mb-8" />
      <div className="h-14 bg-[var(--surface-sunken)] rounded-xl mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl" />
            <div className="h-4 w-3/4 bg-[var(--surface-sunken)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
