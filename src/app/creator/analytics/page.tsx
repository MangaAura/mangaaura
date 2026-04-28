/**
 * Creator Analytics Page
 *
 * Página de estadísticas avanzadas para creadores usando MongoDB.
 * Muestra datos de tiempo de lectura, páginas más vistas, tasa de finalización.
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useCreatorMangas } from '@/hooks/useCreatorMangas';
import {
  AnalyticsDashboard,
  DateRangePicker,
  MangaSelector,
} from '@/components/Analytics';
import type { DateRange, DateRangePreset } from '@/components/Analytics';
import {
  BarChart3Icon,
  CalendarIcon,
  ChevronRightIcon,
  Loader2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterStats {
  chapterId: string;
  mangaId: string;
  reads: number;
  completions: number;
  completionRate: number;
  avgTimeSeconds: number;
  mostViewedPages: Array<{ page: number; views: number }>;
}

interface CreatorStats {
  totalViews: number;
  totalReads: number;
  totalCompletions: number;
  completionRate: number;
  avgTimeSeconds: number;
  chapterStats: ChapterStats[];
  dailyStats: Array<{
    date: string;
    reads: number;
    completions: number;
  }>;
}

export default function CreatorAnalyticsPage() {
  const { data: session } = useSession();
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
        chapterStats: data.chapterStats.map((stat: any) => ({
          ...stat,
          mostViewedPages: [], // Esto se podría obtener con una query adicional
        })),
        dailyStats: [], // Esto requeriría agregación por día
      };

      setStats(formattedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Error al cargar los datos de analytics');
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
      avgScrollDepth: 75, // Placeholder
      popularChapters: stats.chapterStats
        .sort((a, b) => b.reads - a.reads)
        .slice(0, 10)
        .map((stat, index) => ({
          chapterId: stat.chapterId,
          chapterNumber: index + 1, // Placeholder - debería venir del backend
          views: stat.reads,
          title: `Capítulo ${index + 1}`,
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BarChart3Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Estadísticas</h1>
                <p className="text-sm text-slate-500">
                  Analiza el rendimiento de tus obras
                </p>
              </div>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-slate-500">
              <span className="hover:text-slate-700 cursor-pointer">Dashboard</span>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="font-medium text-slate-900">Analytics</span>
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
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
            {selectedManga.coverUrl ? (
              <img
                src={selectedManga.coverUrl}
                alt={selectedManga.title}
                className="w-12 h-16 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-12 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                <BarChart3Icon className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">
                {selectedManga.title}
              </h2>
              <p className="text-sm text-slate-500">
                {selectedManga.chapterCount} capítulos ·{' '}
                {selectedManga.totalViews.toLocaleString('es')} vistas totales
              </p>
            </div>
            <button
              onClick={() => setSelectedMangaId(null)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-600">Cargando estadísticas...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchMongoAnalytics}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
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
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">
                Tiempo de lectura promedio
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {Math.floor(stats.avgTimeSeconds / 60)}m{' '}
                  {stats.avgTimeSeconds % 60}s
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Por capítulo completado
              </p>
            </div>

            {/* Tasa de finalización */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">
                Tasa de finalización
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.completionRate}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Lectores que completan el capítulo
              </p>
            </div>

            {/* Total de lecturas */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">
                Total de lecturas
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.totalReads.toLocaleString('es')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                En el período seleccionado
              </p>
            </div>

            {/* Completados */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">
                Capítulos completados
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.totalCompletions.toLocaleString('es')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Lecturas hasta el final
              </p>
            </div>
          </div>
        )}

        {/* Páginas más vistas por capítulo */}
        {stats?.chapterStats && stats.chapterStats.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Páginas más vistas por capítulo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Capítulo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Lecturas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Completados
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tasa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.chapterStats
                    .sort((a, b) => b.reads - a.reads)
                    .slice(0, 10)
                    .map((stat, index) => (
                      <tr key={stat.chapterId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            Capítulo {index + 1}
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
                                ? 'bg-green-100 text-green-700'
                                : stat.completionRate >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
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
