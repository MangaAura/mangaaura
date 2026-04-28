"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface ModelUsageDataPoint {
  name: string;
  value: number;
  color: string;
}

interface ModelUsagePieChartProps {
  data: ModelUsageDataPoint[];
  innerRadius?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.total || 100;
    const percentage = ((data.value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-white font-medium">{data.name}</span>
        </div>
        <p className="text-slate-300 text-sm">
          {data.value.toLocaleString()} requests
        </p>
        <p className="text-slate-400 text-xs">{percentage}% of total</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;
  
  const total = payload.reduce((sum: number, entry: any) => 
    sum + (entry.payload?.value || 0), 0
  );
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => {
        const percentage = total > 0 
          ? ((entry.payload.value / total) * 100).toFixed(1) 
          : "0.0";
        
        return (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300 text-xs">
              {entry.value} ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

export function ModelUsagePieChart({
  data,
  innerRadius = 60,
}: ModelUsagePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="45%"
          innerRadius={innerRadius}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {dataWithTotal.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default ModelUsagePieChart;
