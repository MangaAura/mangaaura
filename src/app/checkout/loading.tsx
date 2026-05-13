export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="h-8 w-48 bg-[var(--bg-tertiary)] rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-[var(--bg-tertiary)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
