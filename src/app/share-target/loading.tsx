export default function ShareTargetLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-64 bg-tertiary rounded-lg mx-auto mb-4" />
        <div className="h-4 w-48 bg-tertiary rounded-lg mx-auto" />
      </div>
    </div>
  );
}
