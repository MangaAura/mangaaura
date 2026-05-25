import { Skeleton } from '@/components/ui/Skeleton';

export default function CreateThreadLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Skeleton variant="heading" />
      <Skeleton variant="text" className="h-10" />
      <Skeleton variant="text" className="h-40" />
      <Skeleton variant="button" />
    </div>
  );
}
