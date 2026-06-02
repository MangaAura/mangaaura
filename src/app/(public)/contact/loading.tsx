export default function ContactoLoading() {
  return (
    <div role="status" className="min-h-screen bg-background animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="h-8 w-48 bg-tertiary rounded-lg mb-8" />

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="h-40 bg-tertiary rounded-2xl" />
          <div className="h-40 bg-tertiary rounded-2xl" />
          <div className="h-40 bg-tertiary rounded-2xl" />
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-tertiary rounded-3xl p-8 h-96" />
          </div>
          <div className="lg:col-span-3">
            <div className="bg-tertiary rounded-3xl p-8 h-[600px]" />
          </div>
        </div>

        <div className="mt-12">
          <div className="h-8 w-48 bg-tertiary rounded-lg mb-6" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-20 bg-tertiary rounded-2xl" />
            <div className="h-20 bg-tertiary rounded-2xl" />
            <div className="h-20 bg-tertiary rounded-2xl" />
            <div className="h-20 bg-tertiary rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}