'use client';

import { Library, Plus, Check, Loader2, BookOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface CollectionEntry {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: { mangas: number };
  inCollection?: boolean;
}

interface CollectionPickerProps {
  mangaId: string;
  mangaTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionPicker({ mangaId, mangaTitle, open, onOpenChange }: CollectionPickerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useT();
  const [adding, setAdding] = useState<string | null>(null);

  // Fetch user's collections
  const { data, error, isLoading, mutate } = useSWR<{ collections: CollectionEntry[] }>(
    open && session?.user?.id ? `/api/collections?userId=${session.user.id}&mangaId=${mangaId}` : null,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );

  const collections = data?.collections || [];

  const handleToggle = useCallback(async (collectionId: string, isCurrentlyIn: boolean) => {
    setAdding(collectionId);
    try {
      if (isCurrentlyIn) {
        // Remove from collection
        const res = await fetch(`/api/collections/${collectionId}/items?mangaId=${mangaId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to remove');
      } else {
        // Add to collection
        const res = await fetch(`/api/collections/${collectionId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mangaId }),
        });
        if (!res.ok) throw new Error('Failed to add');
      }
      // Optimistic update
      mutate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collections: prev.collections.map((c) =>
            c.id === collectionId ? { ...c, inCollection: !isCurrentlyIn } : c
          ),
        };
      }, false);
    } catch {
      // Revert on error
      mutate();
    } finally {
      setAdding(null);
    }
  }, [mangaId, mutate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-ac-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
      role="dialog"
      aria-modal="true"
      aria-label={t('collectionPicker.title')}
    >
      <div
        className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-ac-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="font-bold text-lg">{t('collectionPicker.title')}</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-80 overflow-y-auto">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t('collectionPicker.addTo', { manga: mangaTitle })}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--error)]">{t('collectionPicker.error')}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {t('collectionPicker.empty')}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  router.push('/collections/create');
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('collectionPicker.createFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => {
                const isIn = collection.inCollection ?? false;
                return (
                  <button
                    key={collection.id}
                    onClick={() => handleToggle(collection.id, isIn)}
                    disabled={adding === collection.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                      isIn
                        ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                        : 'hover:bg-[var(--surface-sunken)] border border-transparent'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        isIn
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--text-inverse)]'
                          : 'border-[var(--border)]'
                      )}
                    >
                      {adding === collection.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isIn ? (
                        <Check className="w-3 h-3" />
                      ) : null}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {collection.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {collection._count.mangas} {collection._count.mangas === 1 ? t('collectionPicker.manga') : t('collectionPicker.mangas')}
                        {collection.description && ` · ${collection.description}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              router.push('/collections/create');
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('collectionPicker.newCollection')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t('common.done')}
          </Button>
        </div>
      </div>
    </div>
  );
}
