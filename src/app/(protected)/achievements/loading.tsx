export default function AchievementsLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="h-8 w-1/3 bg-tertiary rounded-lg mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl p-5 space-y-3">
              <div className="w-12 h-12 bg-tertiary rounded-full" />
              <div className="h-4 bg-tertiary rounded w-3/4" />
              <div className="h-3 bg-tertiary rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
