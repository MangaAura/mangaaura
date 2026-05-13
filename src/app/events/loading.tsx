export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface)] animate-pulse">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="h-8 w-64 bg-[var(--surface-sunken)] rounded-lg mb-6" />
        <div className="flex gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-24 bg-[var(--surface-sunken)] rounded-lg" />
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-56 bg-[var(--surface-sunken)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
