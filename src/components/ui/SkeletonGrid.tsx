'use client';

import { Skeleton } from './Skeleton';

interface SkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4 | 5;
}

export function SkeletonGrid({ count = 6, columns = 4 }: SkeletonGridProps) {
  const gridCols: Record<number, string> = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="image" />
          <Skeleton variant="title" />
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      ))}
    </div>
  );
}
