export default function Loading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 w-1/3 bg-tertiary rounded-lg mb-2" />
        <div className="h-4 w-1/2 bg-tertiary rounded-lg mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="h-7 bg-tertiary rounded w-1/2" />
              <div className="h-3 bg-tertiary rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="h-4 bg-tertiary rounded w-2/3" />
              <div className="h-3 bg-tertiary rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
