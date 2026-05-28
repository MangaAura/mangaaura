'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGenres } from '@/hooks/useGenres';
import { useT } from '@/i18n';

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
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!input.trim()) return [];
    const q = normalize(input);
    return allGenres
      .filter(g => !selected.some(s => normalize(s) === normalize(g.name)))
      .filter(g => normalize(g.name).includes(q))
      .slice(0, 6);
  }, [allGenres, selected, input]);

  const addGenre = useCallback((name: string) => {
    const clean = normalize(name);
    if (!clean) return;
    if (selected.some(s => normalize(s) === clean)) return;
    if (selected.length >= max) return;
    onChange([...selected, clean]);
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [selected, onChange, max]);

  const removeGenre = useCallback((name: string) => {
    onChange(selected.filter(s => normalize(s) !== normalize(name)));
  }, [selected, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addGenre(input);
    }
    if (e.key === 'Backspace' && !input && selected.length > 0) {
      removeGenre(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={t('creatorMangaNew.tagsPlaceholder')}
            error={error}
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filtered.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addGenre(g.name); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-sunken)] transition-colors"
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => addGenre(input)}
          disabled={!input.trim() || selected.length >= max}
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-[var(--text-tertiary)] mt-1">
        {t('creatorMangaNew.tagsHint')} ({selected.length}/{max})
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
            >
              {g}
              <button
                type="button"
                onClick={() => removeGenre(g)}
                className="hover:text-indigo-900"
                aria-label={`Eliminar ${g}`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
