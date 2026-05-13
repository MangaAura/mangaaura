export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="h-12 w-3/4 bg-tertiary rounded-lg mb-4" />
        <div className="h-6 w-1/2 bg-tertiary rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-tertiary rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
