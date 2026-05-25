import { Skeleton } from '@/components/ui/Skeleton';

export default function LibraryLoading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton variant="heading" className="w-40 h-8 mb-6" />

        <div className="flex gap-3 mb-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="button" className="w-24 h-9 rounded-lg flex-shrink-0" />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="image" className="aspect-[3/4] rounded-xl" />
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-1/2 h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
