export default function CheckoutCancelLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse">
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="h-16 w-16 bg-tertiary rounded-full mx-auto mb-6" />
        <div className="h-8 w-48 bg-tertiary rounded-lg mx-auto mb-4" />
        <div className="h-4 w-64 bg-tertiary rounded-lg mx-auto" />
      </div>
    </div>
  );
}
