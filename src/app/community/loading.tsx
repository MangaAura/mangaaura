export default function CommunityLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 animate-pulse">
      <div className="h-12 w-64 bg-[var(--surface-sunken)] rounded-lg mb-4" />
      <div className="h-5 w-96 bg-[var(--surface-sunken)] rounded mb-8" />
      <div className="flex gap-3 mb-8">
        <div className="h-10 w-24 bg-[var(--surface-sunken)] rounded-lg" />
        <div className="h-10 w-24 bg-[var(--surface-sunken)] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-[var(--surface-sunken)] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
