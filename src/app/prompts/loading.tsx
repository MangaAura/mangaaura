export default function PromptsLoading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)] animate-pulse">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="h-8 w-48 bg-[var(--surface-sunken)] rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-[var(--surface-sunken)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
