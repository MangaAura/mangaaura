'use client';

import { Star, FolderOpen, BookOpen } from 'lucide-react';
import Link from 'next/link';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface CollectionEntry {
  id: string;
  title: string;
  coverUrl: string | null;
  description: string | null;
  _count: {
    items: number;
  };
}

interface CollectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: CollectionEntry[];
}

export function CollectionsModal({ open, onOpenChange, collections }: CollectionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
            Colecciones ({collections.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">No tienes colecciones todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors group"
                >
                  <div className="relative w-10 h-10 rounded-lg bg-[var(--surface-sunken)] overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]">
                    {col.coverUrl ? (
                      <OptimizedImage
                        src={col.coverUrl}
                        alt={col.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {col.title}
                    </p>
                    {col.description && (
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{col.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
                    {col._count.items} mangas
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
