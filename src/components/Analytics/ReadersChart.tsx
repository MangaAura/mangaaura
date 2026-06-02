/**
 * ReadersChart Component
 *
 * Gráfico de áreas para lectores únicos en el tiempo con comparativa
 * semana contra semana (período actual vs período anterior).
 */

'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function getChartColors() {
  if (typeof document === 'undefined') return { grid: '#e5e5e5', axis: '#a3a3a3', text: '#6b6b6b', bg: '#ffffff', border: '#e5e5e5', label: '#0f0f0f' };
  const style = getComputedStyle(document.documentElement);
  return {
    grid: style.getPropertyValue('--border').trim() || '#e5e5e5',
    axis: style.getPropertyValue('--text-tertiary').trim() || '#a3a3a3',
    text: style.getPropertyValue('--text-secondary').trim() || '#6b6b6b',
    bg: style.getPropertyValue('--surface-elevated').trim() || '#ffffff',
    border: style.getPropertyValue('--border').trim() || '#e5e5e5',
    label: style.getPropertyValue('--text-primary').trim() || '#0f0f0f',
  };
}

interface ReadersChartProps {
  currentData: Array<{
    date: string;
    readers: number;
  }>;
  previousData?: Array<{
    date: string;
    readers: number;
  }>;
}

export function ReadersChart({ currentData, previousData }: ReadersChartProps) {
  const colors = getChartColors();

  // Merge current + previous into chart data aligned by index position
  const chartData = useMemo(() => {
    return currentData.map((item, idx) => ({
      date: new Date(item.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
      actuals: item.readers,
      previous: (previousData && idx < previousData.length) ? previousData[idx].readers : 0,
    }));
  }, [currentData, previousData]);

  if (currentData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-[var(--text-tertiary)]">
        No hay datos de lectores únicos para el período seleccionado.
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="readersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis
            dataKey="date"
            stroke={colors.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={colors.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
            }}
            labelStyle={{ color: colors.label }}
            itemStyle={{ color: colors.text }}
          />
          {previousData && previousData.length > 0 && (
            <Area
              type="monotone"
              dataKey="previous"
              name="Período anterior"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="actuals"
            name="Período actual"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#readersGradient)"
            dot={false}
            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ReadersChart;
