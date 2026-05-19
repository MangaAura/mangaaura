export default function CreatorSettingsLoading() {
  return (
    <div role="status" className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 bg-tertiary rounded-lg mb-8" />
      <div className="max-w-2xl space-y-6">
        <div className="h-12 bg-tertiary rounded-xl" />
        <div className="h-12 bg-tertiary rounded-xl" />
        <div className="h-32 bg-tertiary rounded-xl" />
        <div className="h-12 w-32 bg-tertiary rounded-xl" />
      </div>
    </div>
  );
}
