export default function AdminLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-1/4 bg-tertiary rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-tertiary rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-tertiary rounded-xl" />
      </div>
    </div>
  );
}
