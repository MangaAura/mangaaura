"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

export interface QueueAreaChartDataPoint {
  time: string;
  high?: number;
  medium?: number;
  low?: number;
  [key: string]: string | number | undefined;
}

interface QueueAreaChartProps {
  data: QueueAreaChartDataPoint[];
  showHigh?: boolean;
  showMedium?: boolean;
  showLow?: boolean;
}

const priorityConfig = {
  high: {
    color: "#ef4444",
    fillColor: "#ef4444",
    name: "High Priority",
  },
  medium: {
    color: "#f59e0b",
    fillColor: "#f59e0b",
    name: "Medium Priority",
  },
  low: {
    color: "#3b82f6",
    fillColor: "#3b82f6",
    name: "Low Priority",
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    
    return (
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
        <p className="text-[var(--text-secondary)] text-xs mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={item.name || `tooltip-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[var(--text-secondary)] text-xs">{item.name}</span>
              </div>
              <span className="text-[var(--text-primary)] font-medium text-xs">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] mt-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-tertiary)] text-xs">Total</span>
            <span className="text-[var(--text-primary)] font-medium text-xs">{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={entry.value || `legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[var(--text-secondary)] text-xs">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function QueueAreaChart({
  data,
  showHigh = true,
  showMedium = true,
  showLow = true,
}: QueueAreaChartProps) {
  const colors = getChartColors();

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
          </linearGradient>
        </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
      <XAxis
        dataKey="time"
        tick={{ fill: colors.text, fontSize: 11 }}
        axisLine={{ stroke: colors.axis }}
        tickLine={{ stroke: colors.axis }}
      />
      <YAxis
        tick={{ fill: colors.text, fontSize: 11 }}
        axisLine={{ stroke: colors.axis }}
        tickLine={{ stroke: colors.axis }}
        allowDecimals={false}
      />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {showHigh && (
          <Area
            type="monotone"
            dataKey="high"
            name={priorityConfig.high.name}
            stackId="1"
            stroke={priorityConfig.high.color}
            fill="url(#highGradient)"
            strokeWidth={2}
          />
        )}
        {showMedium && (
          <Area
            type="monotone"
            dataKey="medium"
            name={priorityConfig.medium.name}
            stackId="1"
            stroke={priorityConfig.medium.color}
            fill="url(#mediumGradient)"
            strokeWidth={2}
          />
        )}
        {showLow && (
          <Area
            type="monotone"
            dataKey="low"
            name={priorityConfig.low.name}
            stackId="1"
            stroke={priorityConfig.low.color}
            fill="url(#lowGradient)"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default QueueAreaChart;
