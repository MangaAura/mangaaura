import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonGrid } from '@/components/ui/SkeletonGrid';

export default function Loading() {
  return (
    <div className="min-h-screen space-y-12 py-8" role="status" aria-label="Cargando página">
      {/* Hero skeleton */}
      <section className="px-4">
        <div className="mx-auto max-w-7xl">
          <Skeleton variant="hero" />
        </div>
      </section>

      {/* Genre grid skeleton */}
      <section className="px-4">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton variant="heading" className="w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-20" />
            ))}
          </div>
        </div>
      </section>

      {/* Manga grid skeleton */}
      <section className="px-4">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton variant="heading" className="w-56" />
          <SkeletonGrid count={8} columns={4} />
        </div>
      </section>

      {/* Sidebar skeleton */}
      <section className="px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton variant="heading" className="w-40" />
              <SkeletonGrid count={4} columns={2} />
            </div>
            <div className="space-y-4">
              <Skeleton variant="heading" className="w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton variant="avatar" />
                  <div className="flex-1 space-y-1">
                    <Skeleton variant="title" />
                    <Skeleton variant="text" className="w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA skeleton */}
      <section className="px-4">
        <div className="mx-auto max-w-7xl">
          <Skeleton variant="card" className="h-40 rounded-xl" />
        </div>
      </section>
    </div>
  );
}
