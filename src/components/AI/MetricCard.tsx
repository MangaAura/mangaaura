"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  green: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  red: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  yellow: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
};

const trendColors = {
  up: "text-green-400",
  down: "text-red-400",
  neutral: "text-slate-400",
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = "blue",
  loading = false,
}: MetricCardProps) {
  const colorStyles = colorClasses[color];
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 transition-all duration-300 hover:border-slate-600">
      <div className="flex items-start justify-between">
        {/* Icon */}
        {icon && (
          <div
            className={`w-10 h-10 rounded-full ${colorStyles.bg} ${colorStyles.text} flex items-center justify-center border ${colorStyles.border}`}
          >
            {icon}
          </div>
        )}

        {/* Trend */}
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1 ${trendColors[trend]}`}>
            <TrendIcon className="w-4 h-4" />
            {trendValue && (
              <span className="text-sm font-medium">{trendValue}</span>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            <span className="text-slate-400 text-sm">Loading...</span>
          </div>
        ) : (
          <h3
            className="text-3xl font-bold text-white transition-all duration-300 animate-in fade-in"
            key={value}
          >
            {value}
          </h3>
        )}
      </div>

      {/* Title */}
      <p className="text-slate-400 text-sm mt-1">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-slate-500 text-xs mt-2">{subtitle}</p>
      )}
    </div>
  );
}

export default MetricCard;
