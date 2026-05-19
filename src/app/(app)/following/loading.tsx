export default function FollowingLoading() {
  return (
    <div role="status" className="animate-pulse space-y-4 p-6 max-w-2xl mx-auto">
      <div className="h-8 w-40 bg-[var(--surface-elevated)] rounded" />
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-10 w-28 bg-[var(--surface-elevated)] rounded-lg" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
