'use client';

import { Library } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { CollectionsTabs } from './CollectionsTabs';
import { CollectionGrid } from '@/components/Collections/CollectionGrid';

function CollectionsPageInner() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) setUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container mx-auto px-4 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Library className="text-[var(--primary)]" size={30} /> Colecciones
            </h1>
            <p className="text-[var(--text-secondary)]">
              Explora y descubre colecciones de manga creadas por la comunidad
            </p>
          </div>
        </div>

        <CollectionsTabs
          defaultValue={filter}
          userId={userId}
          allLabel="Todas"
          publicLabel="Públicas"
          privateLabel="Mis colecciones"
        >
          <CollectionGrid
            filter={filter as 'all' | 'public' | 'private'}
            currentUserId={userId}
          />
        </CollectionsTabs>
      </div>
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-9 w-48 bg-[var(--surface)] rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-96 bg-[var(--surface)] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[16/9] bg-[var(--surface)] rounded-lg animate-pulse" />
              <div className="h-4 w-3/4 bg-[var(--surface)] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-[var(--surface)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPageContent() {
  return (
    <Suspense fallback={<CollectionsSkeleton />}>
      <CollectionsPageInner />
    </Suspense>
  );
}
