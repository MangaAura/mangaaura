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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-slate-300 text-xs mb-1">{label}</p>
        <p className="text-white font-medium">
          {payload[0].value}
          {unit && <span className="text-slate-400 ml-1">{unit}</span>}
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
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={{ stroke: "#475569" }}
          tickLine={{ stroke: "#475569" }}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={{ stroke: "#475569" }}
          tickLine={{ stroke: "#475569" }}
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
