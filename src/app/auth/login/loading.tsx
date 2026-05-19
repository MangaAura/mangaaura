export default function LoginLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse flex items-center justify-center">
      <div className="w-full max-w-md bg-secondary rounded-2xl p-8 space-y-6">
        <div className="h-8 bg-tertiary rounded-lg w-1/2 mx-auto" />
        <div className="space-y-4">
          <div className="h-10 bg-tertiary rounded-xl" />
          <div className="h-10 bg-tertiary rounded-xl" />
          <div className="h-10 bg-tertiary rounded-xl" />
        </div>
      </div>
    </div>
  );
}
