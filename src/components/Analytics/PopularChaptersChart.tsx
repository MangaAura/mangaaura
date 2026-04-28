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

interface PopularChaptersChartProps {
  data: Array<{
    chapterNumber: number;
    views: number;
  }>;
}

export function PopularChaptersChart({ data }: PopularChaptersChartProps) {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} hide />
          <YAxis
            dataKey="chapter"
            type="category"
            stroke="#64748b"
            fontSize={12}
            width={80}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
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
