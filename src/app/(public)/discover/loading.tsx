import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton variant="heading" className="w-1/4 h-8 mb-2" />
        <Skeleton variant="text" className="w-1/3 mb-10" />

        <div className="h-48 rounded-2xl mb-10 overflow-hidden">
          <Skeleton variant="hero" className="h-full rounded-2xl" />
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-10">
            <Skeleton variant="heading" className="w-1/4 h-6 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton variant="image" className="aspect-[3/4] rounded-xl" />
                  <Skeleton variant="text" className="w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
