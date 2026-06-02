'use client';

import { useMemo } from 'react';

interface ReadingStreakCalendarProps {
  /** Array of dates the user read (ISO strings) */
  readDates: string[];
  /** Total current streak in days */
  currentStreak: number;
  /** Longest streak ever */
  longestStreak: number;
  /** Days read this month */
  daysReadThisMonth: number;
}

export function ReadingStreakCalendar({
  readDates,
  currentStreak,
  longestStreak,
  daysReadThisMonth,
}: ReadingStreakCalendarProps) {
  const weeks = useMemo(() => {
    const today = new Date();
    const days: { date: Date; count: number }[] = [];

    // Go back 20 weeks (140 days) from today
    for (let i = 139; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = readDates.filter((d) => d.startsWith(dateStr)).length;
      days.push({ date, count });
    }

    // Group into weeks (Sunday first)
    const weeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];

    // Pad first week to start on Sunday
    const firstDay = days[0].date.getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: new Date(0), count: 0 });
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [readDates]);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-[var(--surface-sunken)]';
    if (count <= 2) return 'bg-[var(--primary)]/20';
    if (count <= 5) return 'bg-[var(--primary)]/40';
    if (count <= 10) return 'bg-[var(--primary)]/60';
    return 'bg-[var(--primary)]';
  };

  const monthLabels = useMemo(() => {
    const months: { label: string; index: string }[] = [];
    for (let i = 0; i < weeks.length; i++) {
      const firstDate = weeks[i].find((d) => d.date.getTime() > 0)?.date;
      if (firstDate) {
        const key = `${firstDate.getMonth()}-${firstDate.getFullYear()}`;
        const isFirst = !months.length || months[months.length - 1].index !== key;
        if (isFirst) {
          months.push({
            label: firstDate.toLocaleDateString('es', { month: 'short' }),
            index: key,
          });
        }
      }
    }
    return months;
  }, [weeks]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-[var(--text-primary)]">Racha de Lectura</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-black text-[var(--primary)]">{currentStreak}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Actual</p>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="text-center">
            <p className="text-2xl font-black text-[var(--warning)]">{longestStreak}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Récord</p>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="text-center">
            <p className="text-2xl font-black text-[var(--success)]">{daysReadThisMonth}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Este mes</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="overflow-x-auto">
        <div className="flex gap-0.5 min-w-fit">
          {/* Month labels */}
          <div className="flex flex-col justify-between text-[10px] text-[var(--text-tertiary)] pr-2 h-[100px]">
            {['Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <span key={i} className="leading-[14px]">{d}</span>
            ))}
          </div>

          {/* Month headers */}
          <div className="flex-1">
            <div className="flex gap-0.5 mb-1">
              {monthLabels.map((m, i) => (
                <div key={i} className="flex-1 text-[10px] text-[var(--text-tertiary)] text-center">
                  {m.label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} ${
                        day.date.getTime() > 0 &&
                        day.date.toDateString() === new Date().toDateString()
                          ? 'ring-2 ring-[var(--primary)]'
                          : ''
                      }`}
                      title={
                        day.date.getTime() > 0
                          ? `${day.date.toLocaleDateString('es')}: ${day.count} lecturas`
                          : ''
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-[var(--text-tertiary)]">
        <span>Menos</span>
        <div className="w-3 h-3 rounded-sm bg-[var(--surface-sunken)]" />
        <div className="w-3 h-3 rounded-sm bg-[var(--primary)]/20" />
        <div className="w-3 h-3 rounded-sm bg-[var(--primary)]/40" />
        <div className="w-3 h-3 rounded-sm bg-[var(--primary)]/60" />
        <div className="w-3 h-3 rounded-sm bg-[var(--primary)]" />
        <span>Más</span>
      </div>
    </div>
  );
}
