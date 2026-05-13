export default function ReaderLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-12 bg-[var(--surface-sunken)]" />
      <div className="flex justify-center items-center py-16">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <div className="aspect-[3/4] w-full bg-[var(--bg-tertiary)] rounded" />
          <div className="flex justify-center gap-4">
            <div className="h-10 w-10 bg-[var(--bg-tertiary)] rounded" />
            <div className="h-10 w-24 bg-[var(--bg-tertiary)] rounded" />
            <div className="h-10 w-10 bg-[var(--bg-tertiary)] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
