export default function CreatorCommunityLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 bg-tertiary rounded-lg mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-tertiary rounded-xl" />
        ))}
      </div>
      <div className="h-10 w-full bg-tertiary rounded-lg mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-tertiary rounded-xl" />
        ))}
      </div>
    </div>
  );
}
