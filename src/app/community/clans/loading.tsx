export default function ClansLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-40 bg-[var(--surface-sunken)] rounded-lg mb-6" />
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-32 bg-[var(--surface-sunken)] rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-[var(--surface-sunken)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
