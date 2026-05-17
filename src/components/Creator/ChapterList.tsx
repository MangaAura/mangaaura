'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn, formatTimeAgo } from '@/lib/utils';
import {
  EditIcon,
  Trash2Icon,
  EyeIcon,
  MoreVerticalIcon,
  FileTextIcon,
} from 'lucide-react';

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
  onDelete?: (chapterId: string) => void;
  className?: string;
}

export function ChapterList({ chapters, mangaId, onDelete, className }: ChapterListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDelete = (chapterId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este capítulo?')) {
      return;
    }
    onDelete?.(chapterId);
    setOpenMenuId(null);
  };

  return (
    <div className={cn('bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Capítulo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Vistas
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Publicado
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {chapters.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
<div className="flex flex-col items-center text-[var(--text-secondary)]">
              <FileTextIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium text-[var(--text-muted)]">No hay capítulos</p>
                    <p className="text-sm">Sube tu primer capítulo para empezar</p>
                  </div>
                </td>
              </tr>
            ) : (
              chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-[var(--surface-elevated)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-[var(--text-primary)]">
                      Cap. {chapter.number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[var(--text-secondary)]">{chapter.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 text-[var(--text-muted)]">
                      <EyeIcon className="w-4 h-4" />
                      <span>{chapter.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-tertiary)]">
                    {formatTimeAgo(chapter.publishedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === chapter.id ? null : chapter.id)}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
                      >
                        <MoreVerticalIcon className="w-4 h-4" />
                      </button>

                      {openMenuId === chapter.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface-elevated)] rounded-lg shadow-lg border border-[var(--border)] z-20 py-1">
                            <Link
                              href={`/reader/${mangaId}/chapter/${chapter.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
                            >
                              <EyeIcon className="w-4 h-4" />
                              Ver
                            </Link>
                            <button
                              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] w-full text-left"
                            >
                              <EditIcon className="w-4 h-4" />
                              Editar
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDelete(chapter.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 w-full text-left"
                            >
                              <Trash2Icon className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
