'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { CollectionCard } from './CollectionCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { extractApiError } from '@/lib/extract-api-error';


interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: { mangas: number };
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  previewMangas: Array<{
    id: string;
    title: string;
    cover: string | null;
  }>;
}

interface CollectionGridProps {
  userId?: string;
  filter?: 'all' | 'public' | 'private';
  currentUserId?: string;
  showCreateButton?: boolean;
}

export function CollectionGrid({
  userId,
  filter = 'all',
  currentUserId,
  showCreateButton = true,
}: CollectionGridProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  const fetchCollections = async () => {
    try {
       
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (filter !== 'all') params.append('filter', filter);

      const response = await fetch(`/api/collections?${params}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      setCollections(data.collections || []);
    } catch (err) {
      handleError(err);
      setError('Error al cargar colecciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchCollections();
    return () => { mounted = false; };
  }, [userId, filter]);

  const handleDelete = (deletedId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== deletedId));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={`collection-skeleton-${i}`} className="space-y-4">
            <Skeleton className="aspect-[16/9]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
    <EmptyState
      title="Error al cargar"
      description={error}
      action={{
        label: 'Reintentar',
        onClick: fetchCollections,
      }}
    />
    );
  }

  if (collections.length === 0) {
    return (
        <EmptyState
          title="Sin colecciones"
          description="Crea tu primera colección para organizar tus mangas favoritos"
          action={{ label: 'Crear colección', onClick: () => window.location.href = '/collections/create' }}
        />
    );
  }

  return (
    <div className="space-y-6">
      {showCreateButton && (
        <div className="flex justify-end">
          <Link href="/collections/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva colección
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            currentUserId={currentUserId}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
