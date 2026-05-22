export default function CollectionsLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-1/3 bg-tertiary rounded-lg mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl overflow-hidden">
              <div className="h-40 bg-tertiary" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-tertiary rounded w-3/4" />
                <div className="h-3 bg-tertiary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
