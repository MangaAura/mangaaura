export default function ReaderChapterLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] animate-pulse">
      <div className="h-12 bg-[var(--surface-sunken)]" />
      <div className="flex flex-col items-center py-8 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] w-full max-w-2xl bg-[var(--bg-tertiary)] rounded" />
        ))}
      </div>
    </div>
  );
}
