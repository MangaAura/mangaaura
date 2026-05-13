export default function OfflineLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-16 w-16 bg-tertiary rounded-full mx-auto mb-6" />
        <div className="h-8 w-48 bg-tertiary rounded-lg mx-auto" />
      </div>
    </div>
  );
}
