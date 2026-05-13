export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-[var(--bg-tertiary)] rounded-lg" />
          <div className="h-8 w-32 bg-[var(--bg-tertiary)] rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--bg-tertiary)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
