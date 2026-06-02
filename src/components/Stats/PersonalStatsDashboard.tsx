'use client';

import { BookOpen, TrendingUp, Award, Flame, Clock } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ReadingDataPoint {
  date: string;
  chapters: number;
}

interface GenreData {
  name: string;
  value: number;
  color: string;
}

interface PersonalStatsDashboardProps {
  weeklyData: ReadingDataPoint[];
  genreData: GenreData[];
  totalChapters: number;
  totalHours: number;
  currentStreak: number;
  level: number;
  xpPoints: number;
}

const GENRE_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

export function PersonalStatsDashboard({
  weeklyData,
  genreData,
  totalChapters,
  totalHours,
  currentStreak,
  level,
  xpPoints,
}: PersonalStatsDashboardProps) {
  const stats = [
    { icon: BookOpen, value: totalChapters, label: 'Capítulos', color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
    { icon: Clock, value: totalHours, label: 'Horas', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
    { icon: Flame, value: currentStreak, label: 'Racha actual', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10' },
    { icon: Award, value: `Nv. ${level}`, label: `${xpPoints.toLocaleString()} XP`, color: 'text-[var(--accent-purple)]', bg: 'bg-[var(--accent-purple)]/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/30 transition-all">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Weekly activity chart */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-bold text-[var(--text-primary)]">Actividad Semanal</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="chapterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Area type="monotone" dataKey="chapters" stroke="var(--primary)" fill="url(#chapterGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Genres bar chart */}
      {genreData.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">Géneros más leídos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {genreData.map((_, index) => (
                    <Cell key={index} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
