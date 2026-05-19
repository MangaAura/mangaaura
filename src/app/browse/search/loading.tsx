export default function SearchLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="bg-secondary border-b border-custom">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="h-8 w-64 bg-tertiary rounded-lg mb-6" />
          <div className="h-12 w-full bg-tertiary rounded-2xl" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 h-64 bg-tertiary rounded-2xl" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-tertiary rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
