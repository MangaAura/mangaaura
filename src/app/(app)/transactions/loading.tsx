export default function TransactionsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6 max-w-4xl mx-auto">
      <div className="h-8 w-64 bg-[var(--surface-elevated)] rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-[var(--surface-elevated)] rounded-xl" />
        <div className="h-24 bg-[var(--surface-elevated)] rounded-xl" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-[var(--surface-elevated)] rounded-xl" />
      ))}
    </div>
  );
}
