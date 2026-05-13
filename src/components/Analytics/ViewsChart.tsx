/**
 * ViewsChart Component
 * 
 * Gráfico de líneas para vistas temporales.
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
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

interface ViewsChartProps {
  data: Array<{
    date: string;
    views: number;
    reads: number;
  }>;
}

export function ViewsChart({ data }: ViewsChartProps) {
  const colors = getChartColors();
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
      views: item.views,
      reads: item.reads,
    }));
  }, [data]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
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
          <Line
            type="monotone"
            dataKey="views"
            name="Vistas"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="reads"
            name="Lecturas"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ViewsChart;
