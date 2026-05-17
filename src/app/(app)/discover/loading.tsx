export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-1/4 bg-tertiary rounded-lg mb-2" />
        <div className="h-4 w-1/3 bg-tertiary rounded-lg mb-10" />
        <div className="h-48 bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 rounded-2xl mb-10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-10">
            <div className="h-5 w-1/4 bg-tertiary rounded-lg mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="aspect-[3/4] bg-tertiary rounded-xl" />
                  <div className="h-3 bg-tertiary rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
