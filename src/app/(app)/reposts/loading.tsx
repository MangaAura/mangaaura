export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-1/3 bg-tertiary rounded-lg mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="h-4 bg-tertiary rounded w-3/4" />
              <div className="h-3 bg-tertiary rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
