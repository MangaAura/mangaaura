'use client';

import { Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { useT } from '@/i18n';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder: placeholderProp, className }: SearchBarProps) {
  const t = useT();
  const placeholder = placeholderProp ?? t('common.search');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch?.(query.trim());
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA', 'SEARCH'].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <form onSubmit={handleSubmit} role="search" className={'relative' + (className ? ' ' + className : '')}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={t('common.search')}
        className="w-full pl-9 pr-14 py-2 bg-[var(--surface)]/50 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface)] border border-[var(--border)] rounded">
        Ctrl+K
      </kbd>
    </form>
  );
}
