export default function AdminSettingsLoading() {
  return (
    <div role="status" className="animate-pulse p-6">
      <div className="h-8 w-48 bg-tertiary rounded-lg mb-6" />
      <div className="space-y-4 max-w-2xl">
        <div className="h-12 bg-tertiary rounded-lg" />
        <div className="h-12 bg-tertiary rounded-lg" />
        <div className="h-32 bg-tertiary rounded-lg" />
        <div className="h-12 w-32 bg-tertiary rounded-lg" />
      </div>
    </div>
  );
}
