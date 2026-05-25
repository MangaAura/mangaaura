import { Skeleton } from '@/components/ui/Skeleton';

export default function MangaLoading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)]">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Skeleton variant="hero" className="h-full rounded-none opacity-30" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-40 relative z-20 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton variant="image" className="w-48 md:w-56 aspect-[2/3] rounded-xl shadow-2xl border border-[var(--border)]" />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Skeleton variant="badge" className="w-20" />
              <Skeleton variant="badge" className="w-16" />
            </div>
            <Skeleton variant="heading" className="h-10 w-3/4" />
            <Skeleton variant="text" className="w-1/3" />
            <div className="flex gap-4 text-sm">
              <Skeleton variant="text" className="w-24" />
              <Skeleton variant="text" className="w-24" />
              <Skeleton variant="text" className="w-24" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="badge" className="w-16" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="text" className="w-2/3" />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton variant="button" className="w-36 h-10" />
              <Skeleton variant="button" className="w-36 h-10" />
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <Skeleton variant="heading" className="w-48 h-8" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
