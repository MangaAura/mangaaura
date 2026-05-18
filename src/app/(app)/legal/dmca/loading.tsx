export default function LegalLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="h-8 w-64 bg-tertiary rounded-lg mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 bg-tertiary rounded w-full" style={{ width: '85%' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
