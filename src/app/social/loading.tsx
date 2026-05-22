export default function SocialLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse" role="status">
      <div className="h-10 w-48 rounded bg-[var(--surface-elevated)]" />
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-full bg-[var(--surface-elevated)]" />
        <div className="h-9 w-28 rounded-full bg-[var(--surface-elevated)]" />
        <div className="h-9 w-20 rounded-full bg-[var(--surface-elevated)]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl bg-[var(--surface-elevated)]">
            <div className="w-12 h-12 rounded-full bg-[var(--surface)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-[var(--surface)]" />
              <div className="h-3 w-full rounded bg-[var(--surface)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--surface)]" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando página social...</span>
    </div>
  );
}
