export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="h-8 w-1/4 bg-tertiary rounded-lg mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tertiary rounded-full" />
                <div className="h-4 bg-tertiary rounded w-1/3" />
              </div>
              <div className="h-3 bg-tertiary rounded w-full" />
              <div className="h-3 bg-tertiary rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
