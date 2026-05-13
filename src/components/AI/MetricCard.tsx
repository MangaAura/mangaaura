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
    bg: "bg-[var(--info)]/20",
    text: "text-[var(--info)]",
    border: "border-[var(--info)]/30",
  },
  green: {
    bg: "bg-[var(--success)]/20",
    text: "text-[var(--success)]",
    border: "border-[var(--success)]/30",
  },
  red: {
    bg: "bg-[var(--error)]/20",
    text: "text-[var(--error)]",
    border: "border-[var(--error)]/30",
  },
  yellow: {
    bg: "bg-[var(--warning)]/20",
    text: "text-[var(--warning)]",
    border: "border-[var(--warning)]/30",
  },
  purple: {
    bg: "bg-[var(--accent-purple)]/20",
    text: "text-[var(--accent-purple)]",
    border: "border-[var(--accent-purple)]/30",
  },
};

const trendColors = {
  up: "text-[var(--success)]",
  down: "text-[var(--error)]",
  neutral: "text-[var(--text-tertiary)]",
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
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-5 transition-all duration-300 hover:border-[var(--border-strong)]">
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
            <Loader2 className="w-6 h-6 text-[var(--text-tertiary)] animate-spin" />
            <span className="text-[var(--text-tertiary)] text-sm">Loading...</span>
          </div>
        ) : (
          <h3
            className="text-3xl font-bold text-[var(--text-primary)] transition-all duration-300 animate-in fade-in"
            key={value}
          >
            {value}
          </h3>
        )}
      </div>

      {/* Title */}
      <p className="text-[var(--text-tertiary)] text-sm mt-1">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[var(--text-muted)] text-xs mt-2">{subtitle}</p>
      )}
    </div>
  );
}

export default MetricCard;
