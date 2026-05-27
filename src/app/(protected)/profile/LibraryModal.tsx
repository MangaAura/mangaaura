'use client';

import { BookOpen, Library } from 'lucide-react';
import Link from 'next/link';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface LibraryEntry {
  id: string;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  status: string;
}

interface LibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: LibraryEntry[];
}

const statusLabels: Record<string, string> = {
  READING: 'Leyendo',
  COMPLETED: 'Completado',
  PLAN_TO_READ: 'Por leer',
  DROPPED: 'Abandonado',
  ON_HOLD: 'En pausa',
};

export function LibraryModal({ open, onOpenChange, entries }: LibraryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-[var(--primary)]" />
            Biblioteca ({entries.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">Tu biblioteca está vacía</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/manga/${entry.manga.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors group"
                >
                  <div className="relative w-10 h-14 rounded bg-[var(--surface-sunken)] overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]">
                    {entry.manga.coverUrl ? (
                      <OptimizedImage
                        src={entry.manga.coverUrl}
                        alt={entry.manga.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold">
                        {entry.manga.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {entry.manga.title}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {statusLabels[entry.status] || entry.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
