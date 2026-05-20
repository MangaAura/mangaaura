import { Skeleton } from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div role="status" className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton variant="heading" className="w-48 h-8" />
          <Skeleton variant="button" className="w-32 h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton variant="card" className="w-full h-48" />
            <Skeleton variant="card" className="w-full h-64" />
            <Skeleton variant="card" className="w-full h-56" />
          </div>
          <div className="space-y-4">
            <Skeleton variant="card" className="w-full h-40" />
            <Skeleton variant="card" className="w-full h-60" />
            <Skeleton variant="card" className="w-full h-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
