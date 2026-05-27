export default function ProfileLoading() {
  return (
    <div role="status" className="min-h-screen animate-pulse">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Cover */}
          <div className="h-48 sm:h-56 rounded-t-xl bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--border)]" />
          {/* Avatar + info card */}
          <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/70 backdrop-blur-md overflow-hidden -mt-24 relative z-10 mx-6">
            <div className="px-6 pb-6">
              <div className="-mt-12 sm:-mt-16 mb-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-[var(--surface)] bg-[var(--surface-elevated)]" />
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-6 w-48 bg-[var(--surface-elevated)] rounded" />
                <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
                <div className="h-4 w-64 bg-[var(--surface-elevated)] rounded" />
              </div>
              {/* Stats row */}
              <div className="flex gap-5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 w-16 bg-[var(--surface-elevated)] rounded" />
                ))}
              </div>
            </div>
          </div>
          {/* Tabs area */}
          <div className="h-64 bg-[var(--surface-elevated)] rounded-xl mx-6" />
        </div>
      </div>
    </div>
  );
}
