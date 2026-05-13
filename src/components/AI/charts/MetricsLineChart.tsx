"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function getChartColors() {
  if (typeof document === 'undefined') return { grid: '#e5e5e5', axis: '#a3a3a3', text: '#6b6b6b' };
  const style = getComputedStyle(document.documentElement);
  return {
    grid: style.getPropertyValue('--border').trim() || '#e5e5e5',
    axis: style.getPropertyValue('--text-tertiary').trim() || '#a3a3a3',
    text: style.getPropertyValue('--text-secondary').trim() || '#6b6b6b',
  };
}

export interface MetricsLineChartDataPoint {
  [key: string]: string | number;
}

interface MetricsLineChartProps {
  data: MetricsLineChartDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  unit?: string;
  name?: string;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
        <p className="text-[var(--text-secondary)] text-xs mb-1">{label}</p>
        <p className="text-[var(--text-primary)] font-medium">
          {payload[0].value}
          {unit && <span className="text-[var(--text-tertiary)] ml-1">{unit}</span>}
        </p>
      </div>
    );
  }
  return null;
};

export function MetricsLineChart({
  data,
  xKey,
  yKey,
  color = "#3b82f6",
  unit = "",
  name = "Value",
}: MetricsLineChartProps) {
  const colors = getChartColors();

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: colors.text, fontSize: 11 }}
          axisLine={{ stroke: colors.axis }}
          tickLine={{ stroke: colors.axis }}
        />
        <YAxis
          tick={{ fill: colors.text, fontSize: 11 }}
          axisLine={{ stroke: colors.axis }}
          tickLine={{ stroke: colors.axis }}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default MetricsLineChart;
