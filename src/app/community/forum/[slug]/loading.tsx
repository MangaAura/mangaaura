import { Skeleton } from '@/components/ui/Skeleton';

export default function ForumThreadLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Skeleton variant="heading" />
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="h-24" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 pl-8">
            <Skeleton variant="avatar" className="h-8 w-8" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-1/4" />
              <Skeleton variant="text" className="h-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
