export default function CorrectionsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6 max-w-4xl mx-auto">
      <div className="h-8 w-48 bg-[var(--surface-elevated)] rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 bg-[var(--surface-elevated)] rounded-xl" />
      ))}
    </div>
  );
}
