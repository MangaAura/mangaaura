export default function AdminModerationLoading() {
  return (
    <div role="status" className="animate-pulse p-6">
      <div className="h-8 w-48 bg-tertiary rounded-lg mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 bg-tertiary rounded-lg" />
        ))}
      </div>
    </div>
  );
}
