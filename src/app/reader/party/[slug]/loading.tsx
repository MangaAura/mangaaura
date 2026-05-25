import { Skeleton } from '@/components/ui/Skeleton';

export default function PartyReadingLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto px-4 space-y-6">
        <Skeleton variant="heading" className="mx-auto w-1/2" />
        <div className="flex justify-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="avatar" />
          ))}
        </div>
        <Skeleton variant="hero" className="h-[60vh] rounded-xl" />
      </div>
    </div>
  );
}
