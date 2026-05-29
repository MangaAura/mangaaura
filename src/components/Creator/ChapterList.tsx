'use client';

import {
  EditIcon,
  Trash2Icon,
  EyeIcon,
  MoreVerticalIcon,
  FileTextIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn, formatTimeAgo } from '@/lib/utils';


export interface ChapterListChapter {
  id: string;
  number: number;
  title: string;
  views: number;
  publishedAt: string;
  status: 'PUBLISHED' | 'DRAFT';
}

interface ChapterListProps {
  chapters: ChapterListChapter[];
  mangaId: string;
  mangaSlug?: string;
  onDelete?: (chapterId: string) => void;
  className?: string;
}

interface DropdownMenuProps {
  chapter: ChapterListChapter;
  mangaId: string;
  mangaSlug?: string;
  onDelete?: (chapterId: string) => void;
  onClose: () => void;
}

function DropdownMenu({ chapter, mangaId, mangaSlug, onDelete, onClose }: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleDelete = () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este capítulo?')) {
      return;
    }
    onDelete?.(chapter.id);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface-elevated)] rounded-lg shadow-lg border border-[var(--border)] z-[100] py-1"
    >
      <Link
        href={mangaSlug ? `/manga/${mangaSlug}/chapter/${chapter.number}` : `/reader/${mangaId}/chapter/${chapter.id}`}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"
      >
        <EyeIcon className="w-4 h-4" />
        Ver
      </Link>
      <Link
        href={mangaSlug ? `/creator/manga/${mangaSlug}/chapter/${chapter.number}/edit` : `/admin/chapters/${chapter.id}`}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"
      >
        <EditIcon className="w-4 h-4" />
        Editar
      </Link>
      <hr className="my-1 border-[var(--border)]" />
      <button
        onClick={handleDelete}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 w-full text-left"
      >
        <Trash2Icon className="w-4 h-4" />
        Eliminar
      </button>
    </div>
  );
}

export function ChapterList({ chapters, mangaId, mangaSlug, onDelete, className }: ChapterListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openMenu = useCallback((chapterId: string) => {
    const button = buttonRefs.current[chapterId];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom, left: rect.left });
    }
    setOpenMenuId(chapterId);
  }, []);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setDropdownPosition(null);
  }, []);

  const handleDelete = useCallback((chapterId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este capítulo?')) {
      return;
    }
    onDelete?.(chapterId);
    closeMenu();
  }, [onDelete, closeMenu]);

  const openChapterMenu = useCallback((chapterId: string) => {
    if (openMenuId === chapterId) {
      closeMenu();
    } else {
      openMenu(chapterId);
    }
  }, [openMenuId, closeMenu, openMenu]);

  const activeChapter = chapters.find((c) => c.id === openMenuId);

  return (
    <>
      <div className={cn('bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] overflow-hidden', className)}>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="flex bg-[var(--surface-elevated)] border-b border-[var(--border)] min-w-max">
              <div className="px-6 py-4 w-24 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Capítulo
              </div>
              <div className="px-6 py-4 w-64 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Título
              </div>
              <div className="px-6 py-4 w-24 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Vistas
              </div>
              <div className="px-6 py-4 w-28 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Estado
              </div>
              <div className="px-6 py-4 w-32 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Publicado
              </div>
              <div className="px-6 py-4 w-20 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Acciones
              </div>
            </div>

            {/* Body */}
            {chapters.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center text-[var(--text-secondary)]">
                  <FileTextIcon className="w-12 h-12 mb-3" />
                  <p className="text-lg font-medium text-[var(--text-muted)]">No hay capítulos</p>
                  <p className="text-sm">Sube tu primer capítulo para empezar</p>
                </div>
              </div>
            ) : (
              chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] min-w-max last:border-b-0"
                >
                  <div className="px-6 py-4 w-24 whitespace-nowrap">
                    <span className="font-medium text-[var(--text-primary)]">
                      Cap. {chapter.number}
                    </span>
                  </div>
                  <div className="px-6 py-4 w-64">
                    <span className="text-[var(--text-secondary)]">{chapter.title}</span>
                  </div>
                  <div className="px-6 py-4 w-24 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 text-[var(--text-muted)]">
                      <EyeIcon className="w-4 h-4" />
                      <span>{chapter.views.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 w-28 whitespace-nowrap text-center">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        chapter.status === 'PUBLISHED'
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                      )}
                    >
                      {chapter.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="px-6 py-4 w-32 whitespace-nowrap text-sm text-[var(--text-tertiary)]">
                    {formatTimeAgo(chapter.publishedAt)}
                  </div>
                  <div className="px-6 py-4 w-20 whitespace-nowrap text-center">
                    <button
                      ref={(el) => { buttonRefs.current[chapter.id] = el; }}
                      onClick={() => openChapterMenu(chapter.id)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-muted)] hover:bg-[var(--surface)] rounded-lg transition-colors relative z-10"
                    >
                      <MoreVerticalIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dropdown rendered via portal to escape overflow containers */}
      {openMenuId && activeChapter && dropdownPosition && createPortal(
        <div
          className="fixed z-[9999]"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <DropdownMenu
            chapter={activeChapter}
            mangaId={mangaId}
            mangaSlug={mangaSlug}
            onDelete={handleDelete}
            onClose={closeMenu}
          />
        </div>,
        document.body
      )}
    </>
  );
}