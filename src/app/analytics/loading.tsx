export default function AnalyticsLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="h-8 w-48 bg-tertiary rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-tertiary rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-tertiary rounded-xl" />
      </div>
    </div>
  );
}
