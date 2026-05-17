/**
 * Creator Analytics Page
 *
 * Página de estadísticas avanzadas para creadores usando MongoDB.
 * Muestra datos de tiempo de lectura, páginas más vistas, tasa de finalización.
 */

'use client';

import { useT } from '@/i18n';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCreatorMangas } from '@/hooks/useCreatorMangas';
import {
  AnalyticsDashboard,
  DateRangePicker,
  MangaSelector,
} from '@/components/Analytics';
import type { DateRange, DateRangePreset } from '@/components/Analytics';
import {
  BarChart3Icon,
  ChevronRightIcon,
  Loader2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/Image/OptimizedImage';

interface ChapterStats {
  chapterId: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  reads: number;
  completions: number;
  completionRate: number;
  avgTimeSeconds: number;
}

interface CreatorStats {
  totalViews: number;
  totalReads: number;
  totalCompletions: number;
  completionRate: number;
  avgTimeSeconds: number;
  avgScrollDepth?: number;
  chapterStats: ChapterStats[];
  dailyStats: Array<{
    date: string;
    reads: number;
    completions: number;
  }>;
}

export default function CreatorAnalyticsPage() {
  const t = useT();
  const { mangas, isLoading: isLoadingMangas } = useCreatorMangas({
    autoRefresh: false,
  });

  // Estado de filtros
  const [selectedMangaId, setSelectedMangaId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');

  // Estado de datos
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transformar mangas para el selector
  const mangaOptions = useMemo(
    () =>
      mangas.map((manga) => ({
        id: manga.id,
        title: manga.title,
        coverUrl: manga.coverUrl,
        totalChapters: manga.chapterCount,
        totalViews: manga.totalViews,
      })),
    [mangas]
  );

  // Manga seleccionado actual
  const selectedManga = useMemo(
    () => mangas.find((m) => m.id === selectedMangaId),
    [mangas, selectedMangaId]
  );

  // Handle date range change
  const handleDateRangeChange = (range: DateRange, preset: DateRangePreset) => {
    setDateRange(range);
    setDatePreset(preset);
  };

// Fetch analytics desde MongoDB vía API
const fetchMongoAnalytics = useCallback(async () => {
    if (mangas.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtener IDs de mangas del creador
      const mangaIds = selectedMangaId
        ? [selectedMangaId]
        : mangas.map((m) => m.id);

      // Llamar al endpoint de API
      const queryParams = new URLSearchParams({
        mangaIds: mangaIds.join(','),
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();

      // Formatear datos para el dashboard
        const formattedData: CreatorStats = {
          ...data,
          chapterStats: data.chapterStats ?? data.popularChapters ?? [],
          dailyStats: data.dailyStats ?? [],
        };

      setStats(formattedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(t('creatorAnalytics.error'));
    } finally {
      setIsLoading(false);
    }
  }, [mangas, selectedMangaId, dateRange]);

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    if (mangas.length > 0) {
      fetchMongoAnalytics();
    }
  }, [fetchMongoAnalytics, mangas.length]);

  // Datos para el dashboard legacy (compatibilidad)
  const dashboardData = useMemo(() => {
    if (!stats) return null;

    return {
      views: stats.totalViews,
      reads: stats.totalReads,
      completions: stats.totalCompletions,
      avgTimeSpent: stats.avgTimeSeconds,
      avgScrollDepth: stats.avgScrollDepth ?? 0,
      popularChapters: stats.chapterStats
        .sort((a, b) => b.reads - a.reads)
        .slice(0, 10)
        .map((stat) => ({
          chapterId: stat.chapterId,
          chapterNumber: stat.chapterNumber ?? 0,
          views: stat.reads,
          title: stat.title ?? `Cap. ${stat.chapterNumber ?? stat.chapterId.slice(0, 8)}`,
          reads: stat.reads,
          completionRate: stat.completionRate,
        })),
      dailyStats: stats.dailyStats.map((day) => ({
        date: day.date,
        views: day.reads,
        reads: day.reads,
      })),
    };
  }, [stats]);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <div className="bg-[var(--surface-elevated)] border-b border-[var(--border)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center">
                <BarChart3Icon className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('creatorAnalytics.title')}</h1>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t('creatorAnalytics.subtitle')}
                </p>
              </div>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-[var(--text-tertiary)]">
              <span className="hover:text-[var(--text-secondary)] cursor-pointer">Dashboard</span>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="font-medium text-[var(--text-primary)]">Analytics</span>
            </nav>
          </div>

          {/* Filters Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {/* Manga Selector */}
            <div className="w-full sm:w-72">
              <MangaSelector
                mangas={mangaOptions}
                selectedId={selectedMangaId}
                onSelect={setSelectedMangaId}
                isLoading={isLoadingMangas}
              />
            </div>

            {/* Date Range Picker */}
            <div className="w-full sm:w-auto">
              <DateRangePicker
                value={dateRange}
                preset={datePreset}
                onChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Selected Manga Info */}
        {selectedManga && (
          <div className="mb-6 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-4 flex items-center gap-4">
            {selectedManga.coverUrl ? (
              <OptimizedImage
                src={selectedManga.coverUrl}
                alt={selectedManga.title}
                width={48}
                height={64}
                className="w-12 h-16 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-12 h-16 bg-[var(--surface-sunken)] rounded-lg flex items-center justify-center">
                <BarChart3Icon className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-[var(--text-primary)]">
                {selectedManga.title}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                {selectedManga.chapterCount} capítulos ·{' '}
                {selectedManga.totalViews.toLocaleString('es')} {t('creatorAnalytics.totalViews')}
              </p>
            </div>
            <button
              onClick={() => setSelectedMangaId(null)}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              {t('creatorAnalytics.viewAll')}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="w-8 h-8 animate-spin text-[var(--primary)]" />
            <span className="ml-3 text-[var(--text-secondary)]">{t('creatorAnalytics.loading')}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl p-6 text-center">
            <p className="text-[var(--error)]">{error}</p>
            <button
              onClick={fetchMongoAnalytics}
              className="mt-3 px-4 py-2 bg-[var(--error)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--error)] transition-colors"
            >
              {t('creatorAnalytics.retry')}
            </button>
          </div>
        )}

        {/* Analytics Dashboard con datos de MongoDB */}
        {!isLoading && !error && dashboardData && (
          <AnalyticsDashboard
            mangaId={selectedMangaId}
            dateRange={dateRange}
            customData={dashboardData}
          />
        )}

        {/* MongoDB Analytics Cards */}
        {stats && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tiempo de lectura promedio */}
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">
                {t('creatorAnalytics.avgReadingTime')}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  {Math.floor(stats.avgTimeSeconds / 60)}m{' '}
                  {stats.avgTimeSeconds % 60}s
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                {t('creatorAnalytics.perChapterCompleted')}
              </p>
            </div>

            {/* Tasa de finalización */}
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">
                {t('creatorAnalytics.completionRate')}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  {stats.completionRate}%
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                {t('creatorAnalytics.completionRateDesc')}
              </p>
            </div>

            {/* Total de lecturas */}
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">
                {t('creatorAnalytics.totalReads')}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  {stats.totalReads.toLocaleString('es')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                {t('creatorAnalytics.totalReadsDesc')}
              </p>
            </div>

            {/* Completados */}
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">
                {t('creatorAnalytics.chaptersCompleted')}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  {stats.totalCompletions.toLocaleString('es')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                {t('creatorAnalytics.chaptersCompletedDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Páginas más vistas por capítulo */}
        {stats?.chapterStats && stats.chapterStats.length > 0 && (
          <div className="mt-8 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {t('creatorAnalytics.mostViewedPages')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {t('creatorAnalytics.chapter')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {t('creatorAnalytics.reads')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {t('creatorAnalytics.completed')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {t('creatorAnalytics.rate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {stats.chapterStats
                    .sort((a, b) => b.reads - a.reads)
                    .slice(0, 10)
        .map((stat) => (
                  <tr key={stat.chapterId} className="hover:bg-[var(--surface)]">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--text-primary)]">
                        {stat.title ?? `${t('creatorAnalytics.chapterNumber')} ${stat.chapterNumber}`}
                      </span>
                    </td>
                        <td className="px-4 py-3 text-right">
                          {stat.reads.toLocaleString('es')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {stat.completions.toLocaleString('es')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              stat.completionRate >= 80
                                ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                : stat.completionRate >= 50
                                ? 'bg-[var(--warning)]/20 text-[var(--warning)]'
                                : 'bg-[var(--error)]/20 text-[var(--error)]'
                            )}
                          >
                            {stat.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
