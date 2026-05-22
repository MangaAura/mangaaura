import { Skeleton } from '@/components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)]">
      {/* Hero Skeleton */}
      <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden rounded-2xl">
        <div className="relative z-20 max-w-2xl px-6 md:px-12 py-16 md:py-24 w-full space-y-6">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="heading" className="w-3/4 h-14" />
          <Skeleton variant="text" className="w-1/2 h-6" />
          <Skeleton variant="text" className="w-full h-6" />
          <div className="flex gap-4 pt-2">
            <Skeleton variant="button" className="w-40 h-12" />
            <Skeleton variant="button" className="w-40 h-12" />
          </div>
          <div className="flex gap-6 pt-6 border-t border-[var(--border)]">
            <Skeleton variant="stat" className="w-24" />
            <Skeleton variant="stat" className="w-24" />
            <Skeleton variant="stat" className="w-24" />
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Genre Marquee */}
        <Skeleton variant="text" className="w-full h-12 rounded-lg" />

        {/* Top Mangas Section */}
        <div className="space-y-4">
          <Skeleton variant="heading" className="w-48 h-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="aspect-[3/4]" />
            ))}
          </div>
        </div>

        {/* Two-column layout skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-4">
              <Skeleton variant="heading" className="w-56 h-8" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="card" className="aspect-[3/4]" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton variant="card" className="h-64" />
            <Skeleton variant="card" className="h-80" />
            <Skeleton variant="card" className="h-72" />
          </div>
        </div>

        {/* CTA Skeleton */}
        <Skeleton variant="card" className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}
