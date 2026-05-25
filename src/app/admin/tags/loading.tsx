export default function AdminTagsLoading() {
  return (
    <div role="status" className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--surface-sunken)] rounded-lg" />
          <div className="h-4 w-64 bg-[var(--surface-sunken)] rounded-lg mt-2" />
        </div>
        <div className="h-10 w-36 bg-[var(--surface-sunken)] rounded-lg" />
      </div>

      <div className="flex gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl w-fit">
        <div className="h-9 w-20 bg-[var(--surface-sunken)] rounded-lg" />
        <div className="h-9 w-28 bg-[var(--surface-sunken)] rounded-lg" />
        <div className="h-9 w-24 bg-[var(--surface-sunken)] rounded-lg" />
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)]">
        <div className="p-6 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-[var(--surface-sunken)] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
