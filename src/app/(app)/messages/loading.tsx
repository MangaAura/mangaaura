export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-1/3 bg-tertiary rounded-lg mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
              <div className="w-12 h-12 bg-tertiary rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-tertiary rounded w-1/3" />
                <div className="h-3 bg-tertiary rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
