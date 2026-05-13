export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-8 w-1/3 bg-tertiary rounded-lg mb-6" />
        <div className="bg-secondary rounded-xl p-6 space-y-6">
          <div className="h-40 bg-tertiary rounded-xl border-2 border-dashed" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-tertiary rounded w-1/4" />
              <div className="h-10 bg-tertiary rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
