'use client';

import { XIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { GENRE_DISPLAY, DEFAULT_GENRE_DISPLAY } from '@/constants/genres';
import { useGenres, type GenreFromApi } from '@/hooks/useGenres';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface GenreSelectorProps {
  selected: string[];
  onChange: (genres: string[]) => void;
  error?: string;
  max?: number;
}

const normalize = (s: string) =>
  s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function GenreSelector({ selected, onChange, error, max = 10 }: GenreSelectorProps) {
  const t = useT();
  const { genres: allGenres } = useGenres();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allGenres;
    const q = normalize(search);
    return allGenres.filter(g => normalize(g.name).includes(q));
  }, [allGenres, search]);

  const toggleGenre = (genre: GenreFromApi) => {
    const norm = normalize(genre.name);
    if (selected.some(s => normalize(s) === norm)) {
      onChange(selected.filter(s => normalize(s) !== norm));
    } else if (selected.length < max) {
      onChange([...selected, genre.name]);
    }
  };

  return (
    <div>
      {/* Search filter */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('creatorMangaNew.tagsPlaceholder')}
          className={cn(
            'w-full rounded-lg border bg-[var(--surface-elevated)] pl-9 pr-3 py-2 text-sm',
            'placeholder:text-[var(--text-tertiary)]',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            error && 'border-red-500 focus:ring-red-500',
          )}
        />
      </div>

      {/* Available genres grid */}
      <div className="flex flex-wrap gap-2 mt-3">
        {filtered.map((genre) => {
          const display = GENRE_DISPLAY[genre.slug] || DEFAULT_GENRE_DISPLAY;
          const Icon = display.icon;
          const isSelected = selected.some(s => normalize(s) === normalize(genre.name));
          const isMaxed = selected.length >= max && !isSelected;

          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre)}
              disabled={isMaxed}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                isSelected
                  ? 'ring-2 ring-offset-1 ring-indigo-500 opacity-100'
                  : 'opacity-80 hover:opacity-100',
                isMaxed && 'opacity-40 cursor-not-allowed',
                display.color,
              )}
            >
              <Icon className="w-4 h-4" />
              {genre.name}
              {isSelected && (
                <XIcon className="w-3 h-3 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && search.trim() && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            {t('creatorMangaNew.noGenresFound')}
          </p>
          {selected.length < max && (
            <button
              type="button"
              onClick={() => {
                onChange([...selected, search.trim()]);
                setSearch('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 transition-all"
            >
              <span className="text-lg leading-none">+</span>
              {t('creatorMangaNew.createGenre', { name: search.trim() })}
            </button>
          )}
        </div>
      )}

      {/* Selected count */}
      <p className="text-xs text-[var(--text-tertiary)] mt-2">
        {selected.length}/{max} {t('creatorMangaNew.tagsHint')}
      </p>

      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
