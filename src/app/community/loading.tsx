export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-[var(--bg-tertiary)] rounded-lg mb-6" />
        <div className="flex gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-[var(--bg-tertiary)] rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-[var(--bg-tertiary)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
