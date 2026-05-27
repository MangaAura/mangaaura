export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[var(--surface-sunken)] rounded" />
      <div className="h-12 bg-[var(--surface-sunken)] rounded" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
      </div>
    </div>
  );
}
