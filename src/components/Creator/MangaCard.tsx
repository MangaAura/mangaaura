'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  EditIcon,
  Trash2Icon,
  BookOpenIcon,
  MoreVerticalIcon,
  EyeIcon,
} from 'lucide-react';

interface MangaCardProps {
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl?: string | null;
    chapterCount: number;
    totalViews: number;
    status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED';
  };
  onDelete?: (id: string) => void;
  className?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ONGOING: { label: 'Publicando', color: 'bg-[var(--success)]/10 text-[var(--success)]' },
  COMPLETED: { label: 'Completado', color: 'bg-[var(--info)]/10 text-[var(--info)]' },
  HIATUS: { label: 'Pausado', color: 'bg-[var(--warning)]/10 text-[var(--warning)]' },
  DROPPED: { label: 'Abandonado', color: 'bg-[var(--error)]/10 text-[var(--error)]' },
};

export function MangaCard({ manga, onDelete, className }: MangaCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const status = statusLabels[manga.status];

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este manga? Esta acción no se puede deshacer.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete?.(manga.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--border-strong)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200',
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] bg-[var(--border)]">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)]">
            <span className="text-[var(--text-inverse)] text-6xl font-bold">
              {manga.title.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn('px-2 py-1 text-xs font-medium rounded-full', status.color)}>
            {status.label}
          </span>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 bg-[var(--surface-elevated)]/90 backdrop-blur-sm rounded-lg hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
          >
            <MoreVerticalIcon className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          
          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface-elevated)] rounded-lg shadow-lg border border-[var(--border)] z-20 py-1">
                <Link
                  href={`/creator/manga/${manga.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
                >
                  <EditIcon className="w-4 h-4" />
                  Editar Manga
                </Link>
                <Link
                  href={`/creator/manga/${manga.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
                >
                  <BookOpenIcon className="w-4 h-4" />
                  Gestionar Capítulos
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 w-full text-left"
                >
                  <Trash2Icon className="w-4 h-4" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1" title={manga.title}>
          {manga.title}
        </h3>
        
        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1">
            <BookOpenIcon className="w-4 h-4" />
            <span>{manga.chapterCount} caps</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>{manga.totalViews.toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <Link href={`/creator/manga/${manga.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <EditIcon className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </Link>
          <Link href={`/creator/manga/${manga.id}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full">
              <BookOpenIcon className="w-4 h-4 mr-1" />
              Capítulos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
