/**
 * MangaSelector Component
 *
 * Dropdown para seleccionar manga específico o "Todos".
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BookOpenIcon, ChevronDownIcon, SearchIcon, CheckIcon } from 'lucide-react';

export interface MangaOption {
  id: string;
  title: string;
  coverUrl?: string | null;
  totalChapters?: number;
  totalViews?: number;
}

interface MangaSelectorProps {
  /** Lista de mangas disponibles */
  mangas: MangaOption[];
  /** ID del manga seleccionado (null para "Todos") */
  selectedId: string | null;
  /** Callback al seleccionar un manga */
  onSelect: (mangaId: string | null) => void;
  /** Clases adicionales */
  className?: string;
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Texto para la opción "Todos" */
  allText?: string;
  /** Deshabilitar el selector */
  disabled?: boolean;
  /** Estado de carga */
  isLoading?: boolean;
}

export function MangaSelector({
  mangas,
  selectedId,
  onSelect,
  className,
  placeholder = 'Seleccionar manga',
  allText = 'Todos los mangas',
  disabled = false,
  isLoading = false,
}: MangaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedManga = useMemo(
    () => mangas.find((m) => m.id === selectedId),
    [mangas, selectedId]
  );

  const filteredMangas = useMemo(() => {
    if (!searchQuery.trim()) return mangas;
    const query = searchQuery.toLowerCase();
    return mangas.filter((manga) =>
      manga.title.toLowerCase().includes(query)
    );
  }, [mangas, searchQuery]);

  const handleSelect = (mangaId: string | null) => {
    onSelect(mangaId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const displayLabel = selectedId
    ? selectedManga?.title ?? placeholder
    : allText;

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={cn(
          'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border',
'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)]',
        'hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]',
          isOpen && 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
        )}
      >
        {selectedManga?.coverUrl ? (
          <img
            src={selectedManga.coverUrl}
            alt={selectedManga.title}
            className="w-6 h-8 object-cover rounded"
          />
        ) : (
          <BookOpenIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
        )}

        <span className="flex-1 text-left text-sm font-medium truncate">
          {isLoading ? 'Cargando...' : displayLabel}
        </span>

        <ChevronDownIcon
          className={cn(
            'w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] shadow-lg z-50 overflow-hidden">
            {/* Search Input */}
            {mangas.length > 5 && (
              <div className="p-2 border-b border-[var(--border)]">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar manga..."
                    className={cn(
                      'w-full pl-9 pr-3 py-2 text-sm rounded-lg border',
                      'border-[var(--border)] text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)]',
                      'focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto">
              {/* "All" Option */}
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                  'transition-colors duration-150',
selectedId === null
          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]'
                )}
              >
                <div className="w-6 h-8 flex items-center justify-center">
<BookOpenIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                </div>
                <span className="flex-1 text-sm font-medium">{allText}</span>
                {selectedId === null && (
                  <CheckIcon className="w-4 h-4 text-[var(--primary)]" />
                )}
              </button>

              {/* Manga Options */}
              {filteredMangas.map((manga) => (
                <button
                  key={manga.id}
                  onClick={() => handleSelect(manga.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                    'transition-colors duration-150',
selectedId === manga.id
              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]'
                  )}
                >
                  {manga.coverUrl ? (
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="w-6 h-8 object-cover rounded"
                    />
                  ) : (
<div className="w-6 h-8 bg-[var(--surface-sunken)] rounded flex items-center justify-center">
        <BookOpenIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">
                      {manga.title}
                    </span>
                    {manga.totalChapters !== undefined && (
                      <span className="block text-xs text-[var(--text-tertiary)]">
                        {manga.totalChapters} capítulos
                      </span>
                    )}
                  </div>
                  {selectedId === manga.id && (
                    <CheckIcon className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                  )}
                </button>
              ))}

              {filteredMangas.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-[var(--text-tertiary)]">
                  No se encontraron mangas
                </div>
              )}
            </div>

            {/* Footer with count */}
            <div className="px-3 py-2 bg-[var(--surface-sunken)] border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
              {mangas.length} manga{mangas.length !== 1 ? 's' : ''} en total
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MangaSelector;
