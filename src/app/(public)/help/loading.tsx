export default function HelpLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-1/4 bg-tertiary rounded-lg mb-6" />
        <div className="h-10 bg-tertiary rounded-xl mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-secondary rounded-xl p-5">
              <div className="h-5 bg-tertiary rounded w-1/2 mb-3" />
              <div className="h-3 bg-tertiary rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
