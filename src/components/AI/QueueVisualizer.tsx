'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { QueueStats } from '@/infrastructure/queue/InferenceJobQueue';

interface QueueVisualizerProps {
  stats: QueueStats;
  maxBars?: number;
  className?: string;
}

/**
 * Componente para visualizar la cola de jobs de IA
 * Muestra barras horizontales animadas representando jobs pendientes por prioridad
 */
export function QueueVisualizer({
  stats,
  maxBars = 20,
  className,
}: QueueVisualizerProps) {
  // Mapeo de prioridades a colores y etiquetas
  const priorityConfig = {
    1: { color: 'bg-red-500', label: 'Critical', textColor: 'text-red-400' },
    2: { color: 'bg-orange-500', label: 'High', textColor: 'text-orange-400' },
    3: { color: 'bg-blue-500', label: 'Normal', textColor: 'text-blue-400' },
    4: { color: 'bg-slate-400', label: 'Low', textColor: 'text-slate-400' },
    5: { color: 'bg-slate-300', label: 'Background', textColor: 'text-slate-300' },
  };

  // Calcular distribución de barras por prioridad
  const totalPending = stats.length - stats.processing;

  // Generar array de barras basado en distribución por prioridad
  const generateBars = (): { priority: number; key: string }[] => {
    if (totalPending <= 0) return [];

    const bars: { priority: number; key: string }[] = [];
    const byPriority = stats.byPriority || {};

    // Distribuir barras proporcionalmente
    Object.entries(byPriority)
      .sort(([a], [b]) => Number(a) - Number(b)) // Ordenar por prioridad (menor = más alta)
      .forEach(([priority, count]) => {
        const proportion = count / totalPending;
        const barCount = Math.max(1, Math.round(proportion * maxBars));

        for (let i = 0; i < barCount && bars.length < maxBars; i++) {
          bars.push({
            priority: Number(priority),
            key: `${priority}-${i}-${Date.now()}`,
          });
        }
      });

    return bars.slice(0, maxBars);
  };

  const bars = generateBars();
  const isEmpty = totalPending === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              stats.processing > 0 ? 'animate-pulse bg-green-500' : 'bg-slate-400'
            )}
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Queue Status
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {stats.processing} processing / {stats.length} total
        </span>
      </div>

      {/* Visualización de barras */}
      <div className="space-y-1.5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Queue empty - All caught up!
            </p>
            <p className="text-xs text-slate-500 mt-1">
              No pending jobs in queue
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {bars.map((bar, index) => {
              const config = priorityConfig[bar.priority as keyof typeof priorityConfig] ||
                priorityConfig[5];
              const delay = index * 50; // Stagger animation

              return (
                <div
                  key={`${bar.priority}-${index}`}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    config.color,
                    'animate-pulse'
                  )}
                  style={{
                    width: `${Math.max(20, 100 - index * 3)}%`,
                    animationDelay: `${delay}ms`,
                    opacity: 1 - index * 0.03,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Leyenda por prioridad */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          {Object.entries(stats.byPriority || {})
            .filter(([, count]) => count > 0)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([priority, count]) => {
              const config =
                priorityConfig[Number(priority) as keyof typeof priorityConfig] ||
                priorityConfig[5];
              return (
                <div key={priority} className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', config.color)} />
                  <span className={cn('text-xs font-medium', config.textColor)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-500">({count})</span>
                </div>
              );
            })}
        </div>
      )}

      {/* Estadísticas adicionales */}
      <div className="flex justify-between pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700">
        <span>Completed: {stats.completed}</span>
        <span>Failed: {stats.failed}</span>
      </div>
    </div>
  );
}

export default QueueVisualizer;
