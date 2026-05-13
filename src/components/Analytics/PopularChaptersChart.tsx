/**
 * PopularChaptersChart Component
 * 
 * Gráfico de barras para capítulos más populares.
 */

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
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

interface PopularChaptersChartProps {
  data: Array<{
    chapterNumber: number;
    views: number;
  }>;
}

export function PopularChaptersChart({ data }: PopularChaptersChartProps) {
  const colors = getChartColors();
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((item) => ({
        chapter: `Cap. ${item.chapterNumber}`,
        views: item.views,
      }));
  }, [data]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
          <XAxis type="number" stroke={colors.axis} fontSize={12} hide />
          <YAxis
            dataKey="chapter"
            type="category"
            stroke={colors.axis}
            fontSize={12}
            width={80}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
            }}
            labelStyle={{ color: colors.label }}
            itemStyle={{ color: colors.text }}
            formatter={(value) => [`${Number(value).toLocaleString()}`, 'Vistas']}
          />
          <Bar
            dataKey="views"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PopularChaptersChart;
