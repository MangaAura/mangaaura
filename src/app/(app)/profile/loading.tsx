export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-tertiary rounded-full" />
          <div className="space-y-3">
            <div className="h-6 bg-tertiary rounded w-48" />
            <div className="h-4 bg-tertiary rounded w-32" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}
