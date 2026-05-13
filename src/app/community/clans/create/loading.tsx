export default function ClanCreateLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="h-8 w-48 bg-tertiary rounded-lg mb-8" />
        <div className="space-y-6">
          <div className="h-12 bg-tertiary rounded-xl" />
          <div className="h-32 bg-tertiary rounded-xl" />
          <div className="h-12 bg-tertiary rounded-xl" />
          <div className="h-12 w-32 bg-tertiary rounded-xl" />
        </div>
      </div>
    </div>
  );
}
