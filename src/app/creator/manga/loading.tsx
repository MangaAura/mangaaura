'use client';

import { Skeletons } from '@/components/Skeletons';

export default function MyMangaLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-[var(--surface-sunken)] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeletons.MangaCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
