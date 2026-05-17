export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-1/4 bg-tertiary rounded-lg mb-2" />
        <div className="h-4 w-1/2 bg-tertiary rounded-lg mb-8" />
        <div className="bg-secondary rounded-xl p-6 space-y-4 mb-6">
          <div className="h-4 bg-tertiary rounded w-1/4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-tertiary/50 rounded-lg p-3 space-y-2">
                <div className="h-3 bg-tertiary rounded w-1/2" />
                <div className="h-6 bg-tertiary rounded w-2/3" />
                <div className="h-2 bg-tertiary rounded w-full" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-secondary rounded-xl p-4 mb-3 space-y-2">
            <div className="h-4 bg-tertiary rounded w-3/4" />
            <div className="h-3 bg-tertiary rounded w-1/2" />
            <div className="h-2 bg-tertiary rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
