export default function ChatLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-tertiary rounded-full" />
          <div className="h-5 bg-tertiary rounded w-1/4" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="h-12 bg-tertiary rounded-2xl w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
