/**
 * AnalyticsDashboard Component
 *
 * Dashboard completo de analytics para creadores.
 */

'use client';

import {
  EyeIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  BookOpenIcon,
  TrendingUpIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';

import { PopularChaptersChart } from './PopularChaptersChart';
import { StatCard } from './StatCard';
import { ViewsChart } from './ViewsChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { cn } from '@/lib/utils';
// AnalyticsData interface inline to avoid import issues
interface AnalyticsData {
  views: number;
  reads: number;
  completions: number;
  avgTimeSpent: number;
  avgScrollDepth: number;
  popularChapters: Array<{
    chapterId: string;
    chapterNumber: number;
    views: number;
    title?: string;
    reads?: number;
    completionRate?: number;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    reads: number;
  }>;
}

interface PopularChapter {
  chapterId: string;
  chapterNumber: number;
  title?: string;
  views: number;
  reads: number;
  completionRate: number;
}

interface DashboardData extends AnalyticsData {
  uniqueReaders: number;
  avgTimeSpent: number;
  completionRate: number;
  popularChapters: PopularChapter[];
}

interface AnalyticsDashboardProps {
  /** ID del manga seleccionado (null para todos) */
  mangaId?: string | null;
  /** Rango de fechas */
  dateRange: { from: Date; to: Date };
  /** Clases adicionales */
  className?: string;
  /** Datos personalizados (opcional, para usar con MongoDB) */
  customData?: AnalyticsData | null;
}

// Formato de tiempo legible
function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

export function AnalyticsDashboard({
  mangaId,
  dateRange,
  className,
  customData,
}: AnalyticsDashboardProps) {
  const { fetchAnalytics } = useAnalytics(mangaId ?? undefined, dateRange);
  const { handleError } = useErrorHandler();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(!customData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Si se proporcionan customData, usarlos directamente
  useEffect(() => {
    if (customData) {
      const dashboardData: DashboardData = {
        ...customData,
        uniqueReaders: Math.round(customData.reads * 0.8),
        completionRate: customData.reads > 0
          ? Math.round((customData.completions / customData.reads) * 100)
          : 0,
        popularChapters: customData.popularChapters.map((ch) => ({
          ...ch,
          reads: ch.reads || Math.round(ch.views * 0.7),
          completionRate: ch.completionRate || (customData.reads > 0 ? Math.round((customData.completions / customData.reads) * 100) : 0),
        })),
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(dashboardData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
    }
  }, [customData]);

  // Cargar datos (solo si no hay customData)
  const loadData = useCallback(
    async (background = false) => {
      // Si hay customData, no cargar desde la API
      if (customData) {
        setIsRefreshing(false);
        return;
      }

      if (!background) setIsLoading(true);
      setIsRefreshing(true);
      setError(null);

      try {
        const result = await fetchAnalytics();
        if (result) {
          // Transformar datos para incluir métricas calculadas
          const dashboardData: DashboardData = {
            ...result,
            // Calcular unique readers (estimado basado en completions y eventos)
            uniqueReaders: Math.round(result.reads * 0.8), // Estimación
            avgTimeSpent: result.avgTimeSpent,
            completionRate:
              result.reads > 0
                ? Math.round((result.completions / result.reads) * 100)
                : 0,
            popularChapters: result.popularChapters.map((ch) => ({
              ...ch,
              reads: result.views > 0 ? Math.round(ch.views * (result.reads / result.views)) : 0,
              completionRate: result.reads > 0 ? Math.round((result.completions / result.reads) * 100) : 0,
            })),
          };
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setData(dashboardData);
          setLastUpdated(new Date());
        }
      } catch (err) {
        setError('Error al cargar los datos de analytics');
        handleError(err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchAnalytics]
  );

  // Carga inicial y cuando cambian filtros
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Calcular trends (simulados - en producción vendrían del backend)
  const trends = useMemo(
    () => ({
      views: 12,
      readers: 8,
      avgTime: -3,
      completion: 5,
    }),
    []
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Skeleton para stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={`stat-skeleton-${i}`}
              className="h-32 bg-[var(--surface-sunken)] rounded-xl animate-pulse"
            />
          ))}
        </div>
        {/* Skeleton para gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div className="h-80 bg-[var(--surface-sunken)] rounded-xl animate-pulse" />
        <div className="h-80 bg-[var(--surface-sunken)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center">
<div className="w-16 h-16 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <TrendingUpIcon className="w-8 h-8 text-[var(--error)]" />
          </div>
<h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        Error al cargar datos
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
          <button
            onClick={() => loadData(false)}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center">
<div className="w-16 h-16 bg-[var(--surface-sunken)] rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpenIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        No hay datos disponibles
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
            No se encontraron estadísticas para el período seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Resumen de Estadísticas
          </h2>
          {lastUpdated && (
<p className="text-xs text-[var(--text-secondary)]">
        Última actualización: {lastUpdated.toLocaleTimeString('es')}
            </p>
          )}
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium',
'text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg',
'hover:bg-[var(--primary)]/10 transition-colors',
            isRefreshing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCwIcon
            className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
          />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={data.views}
          trend={trends.views}
          trendLabel="vs período anterior"
          icon={EyeIcon}
          format="number"
        />
        <StatCard
          title="Unique Readers"
          value={data.uniqueReaders}
          trend={trends.readers}
          trendLabel="vs período anterior"
          icon={UsersIcon}
          format="number"
        />
        <StatCard
          title="Avg Time"
          value={formatTime(data.avgTimeSpent)}
          trend={trends.avgTime}
          trendLabel="vs período anterior"
          icon={ClockIcon}
        />
        <StatCard
          title="Completion Rate"
          value={data.completionRate}
          trend={trends.completion}
          trendLabel="vs período anterior"
          icon={CheckCircleIcon}
          variant="highlight"
          format="percentage"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Chart */}
<div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
        <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Vistas en el tiempo
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
                Evolución de vistas y lecturas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--info)]" />
<span className="text-xs text-[var(--text-secondary)]">Vistas</span>
        </div>
        <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
        <span className="text-xs text-[var(--text-secondary)]">Lecturas</span>
              </div>
            </div>
          </div>
          <ViewsChart
            data={data.dailyStats.map((day) => ({
              date: day.date,
              views: day.views,
              reads: day.reads,
            }))}
          />
        </div>

        {/* Popular Chapters Chart */}
<div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
        <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Capítulos más populares
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
                Top 10 por número de vistas
              </p>
            </div>
          </div>
          <PopularChaptersChart
            data={data.popularChapters.map((ch) => ({
              chapterNumber: ch.chapterNumber,
              views: ch.views,
            }))}
          />
        </div>
      </div>

      {/* Popular Chapters Table */}
<div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Top 10 Capítulos
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
            Rendimiento detallado de los capítulos más leídos
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--surface-sunken)]">
              <tr>
<th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Posición
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Capítulo
        </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Vistas
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Lecturas
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Tasa Completado
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.popularChapters.map((chapter, index) => (
                <tr
                  key={chapter.chapterId}
                  className="hover:bg-[var(--surface-sunken)] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
index === 0
            ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          : index === 1
                          ? 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'
                          : index === 2
                          ? 'bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'
                      )}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
<div className="w-10 h-10 bg-[var(--surface-sunken)] rounded-lg flex items-center justify-center">
        <BookOpenIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                      </div>
                      <div>
<p className="text-sm font-medium text-[var(--text-primary)]">
        Capítulo {chapter.chapterNumber}
        </p>
        {chapter.title && (
        <p className="text-xs text-[var(--text-secondary)]">
                            {chapter.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
<p className="text-sm font-semibold text-[var(--text-primary)]">
        {chapter.views.toLocaleString('es')}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">vistas</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
<p className="text-sm font-semibold text-[var(--text-primary)]">
        {chapter.reads.toLocaleString('es')}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">lecturas</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        chapter.completionRate >= 80
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : chapter.completionRate >= 50
		? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          : 'bg-[var(--error)]/10 text-[var(--error)]'
                      )}
                    >
                      {chapter.completionRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm font-medium text-[var(--text-tertiary)]">
                        —
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.popularChapters.length === 0 && (
          <div className="p-12 text-center">
<BookOpenIcon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
              No hay capítulos
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Este manga aún no tiene capítulos publicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
