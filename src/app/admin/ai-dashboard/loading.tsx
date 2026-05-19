export default function AdminAiDashboardLoading() {
  return (
    <div role="status" className="animate-pulse p-6">
      <div className="h-8 w-56 bg-tertiary rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-tertiary rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-tertiary rounded-xl" />
    </div>
  );
}
