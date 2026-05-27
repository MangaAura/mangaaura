'use client';

import { motion } from 'framer-motion';

interface StatItem {
  value: number;
  label: string;
  onClick?: () => void;
}

interface ProfileStatsRowProps {
  stats: StatItem[];
}

export function ProfileStatsRow({ stats }: ProfileStatsRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
        >
          {stat.onClick ? (
            <button
              onClick={stat.onClick}
              className="group text-left"
            >
              <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                {stat.value.toLocaleString()}
              </span>
              <span className="text-sm text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors ml-1">
                {stat.label}
              </span>
              {i < stats.length - 1 && (
                <span className="ml-5 text-[var(--border-strong)] select-none" aria-hidden="true">·</span>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="font-bold text-[var(--text-primary)]">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">{stat.label}</span>
              {i < stats.length - 1 && (
                <span className="ml-5 text-[var(--border-strong)] select-none" aria-hidden="true">·</span>
              )}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
