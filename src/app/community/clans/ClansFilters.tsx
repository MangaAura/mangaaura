'use client';

import { Search, SlidersHorizontal, TrendingUp, Trophy, ArrowUpDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';

import { useT } from '@/i18n';

export default function ClansFilters() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'monthlyScore';
  const inputRef = useRef<HTMLInputElement>(null);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset page when search/sort changes
    params.delete('page');
    router.push(`/community/clans?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = (formData.get('search') as string) || '';
    updateParams({ search: newSearch || null });
  };

  const sortOptions = [
    { value: 'monthlyScore', label: t('clansFilter.sortMonthly'), icon: TrendingUp },
    { value: 'totalScore', label: t('clansFilter.sortTotal'), icon: Trophy },
    { value: 'name', label: t('clansFilter.sortName'), icon: ArrowUpDown },
  ];


  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <form onSubmit={handleSearchSubmit} className="flex-1 relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
        <input
          ref={inputRef}
          type="text"
          name="search"
          placeholder={t('clansFilter.searchPlaceholder')}
          aria-label={t('clansFilter.searchLabel')}
          defaultValue={search}
          className="w-full bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10 focus:bg-[var(--surface)] transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => { updateParams({ search: null }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
            aria-label="Limpiar búsqueda"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </form>
      <div className="relative">
        <SlidersHorizontal size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
        <select
          name="sort-by"
          value={sortBy}
          onChange={(e) => updateParams({ sortBy: e.target.value === 'monthlyScore' ? null : e.target.value })}
          aria-label={t('clansFilter.sortLabel')}
          className="appearance-none bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] rounded-xl pl-9 pr-9 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10 transition-all cursor-pointer min-w-[160px]"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
