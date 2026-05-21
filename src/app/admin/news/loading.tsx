export default function AdminNewsLoading() {
  return (
    <div role="status" className="animate-pulse p-6">
      <div className="h-8 w-48 bg-[var(--surface-sunken)] rounded-lg mb-6" />
      <div className="h-10 w-full bg-[var(--surface-sunken)] rounded-lg mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--surface-sunken)] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
