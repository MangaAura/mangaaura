export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[var(--surface-sunken)] rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-[var(--surface-sunken)] rounded" />)}
      </div>
    </div>
  );
}
