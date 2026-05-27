export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[var(--surface-sunken)] rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[var(--surface-sunken)] rounded" />)}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-[var(--surface-sunken)] rounded" />)}
      </div>
    </div>
  );
}
