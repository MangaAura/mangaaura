'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useT } from '@/i18n';

export default function ClansFilters() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'monthlyScore';

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

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <form onSubmit={handleSearchSubmit} className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
        <input
          type="text"
          name="search"
          placeholder={t('clansFilter.searchPlaceholder')}
          aria-label={t('clansFilter.searchLabel')}
          defaultValue={search}
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </form>
      <select
        value={sortBy}
        onChange={(e) => updateParams({ sortBy: e.target.value === 'monthlyScore' ? null : e.target.value })}
        aria-label={t('clansFilter.sortLabel')}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
      >
        <option value="monthlyScore">{t('clansFilter.sortMonthly')}</option>
        <option value="totalScore">{t('clansFilter.sortTotal')}</option>
        <option value="name">{t('clansFilter.sortName')}</option>
      </select>
    </div>
  );
}
