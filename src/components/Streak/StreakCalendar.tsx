'use client';

import { Flame, ChevronLeft, ChevronRight, Lock, Snowflake } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/** A single day cell in the calendar */
interface DayCell {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 6=Sat
  weekIndex: number;
  hasRead: boolean;
  isToday: boolean;
  isFuture: boolean;
  timestamp: number; // for sorting
}

type StreakCalendarProps = {
  /** Array of YYYY-MM-DD strings representing days the user read */
  readingDays: string[];
  /** Current streak count */
  streak: number;
  /** Whether the user already read today */
  alreadyReadToday: boolean;
  /** Available streak freezes */
  freezesAvailable: number;
  /** Number of weeks to display (default 15) */
  weeksToShow?: number;
  /** Handler to use a streak freeze */
  onUseFreeze?: () => void;
  /** Whether a freeze action is in progress */
  freezeLoading?: boolean;
};

const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Intensity colors: 0 = no read, 1-2 = light, etc. */
function getIntensityColor(hasRead: boolean, isToday: boolean, isFuture: boolean): string {
  if (isFuture) return 'bg-[var(--surface-sunken)]/30';
  if (isToday && hasRead) return 'bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-green)]/70';
  if (isToday) return 'bg-[var(--accent-green)]/20 border border-[var(--accent-green)]/40';
  if (hasRead) return 'bg-[var(--accent-green)]/60';
  return 'bg-[var(--surface-sunken)]';
}

export function StreakCalendar({
  readingDays,
  streak,
  alreadyReadToday,
  freezesAvailable,
  weeksToShow = 15,
  onUseFreeze,
  freezeLoading = false,
}: StreakCalendarProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const readingDaysSet = useMemo(() => new Set(readingDays), [readingDays]);

  const { cells, totalWeeks, months } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the end of the current week (next Saturday)
    const endDate = new Date(today);
    const daysToSaturday = 6 - today.getDay();
    endDate.setDate(endDate.getDate() + daysToSaturday);

    // Start from weeksToShow weeks back from endDate
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (weeksToShow * 7) + 1);

    const cellList: DayCell[] = [];
    let weekIdx = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      const dayOfWeek = d.getDay();
      const hasRead = readingDaysSet.has(dateStr);
      const isToday = formatDate(today) === dateStr;
      const isFuture = d > today;

      if (dayOfWeek === 1 && cellList.length > 0) {
        weekIdx++;
      }

      cellList.push({
        date: dateStr,
        dayOfWeek,
        weekIndex: dayOfWeek === 0 ? weekIdx : weekIdx,
        hasRead,
        isToday,
        isFuture,
        timestamp: d.getTime(),
      });
    }

    // Count total weeks
    const totalWeeksCount = weekIdx + 1;

    // Find month boundaries for labels
    const monthMap: { week: number; label: string }[] = [];
    let lastMonth = -1;
    for (const cell of cellList) {
      const month = new Date(cell.date).getMonth();
      if (month !== lastMonth) {
        monthMap.push({ week: cell.weekIndex, label: MONTH_LABELS[month] });
        lastMonth = month;
      }
    }

    return { cells: cellList, totalWeeks: totalWeeksCount, months: monthMap };
  }, [readingDaysSet, weeksToShow]);

  const maxScroll = Math.max(0, totalWeeks - weeksToShow);

  // Group cells by week for rendering
  const weekGrid: (DayCell | null)[][] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const week: (DayCell | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = cells.find((c) => c.weekIndex === w && c.dayOfWeek === d);
      week.push(cell || null);
    }
    weekGrid.push(week);
  }

  const visibleWeeks = weekGrid.slice(scrollOffset, scrollOffset + weeksToShow);

  return (
    <Card className="p-5 border border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              alreadyReadToday
                ? 'bg-[var(--accent-green)]/20'
                : 'bg-[var(--surface-sunken)]',
            )}
          >
            <Flame
              className={cn(
                'w-5 h-5',
                alreadyReadToday
                  ? 'text-[var(--accent-green)]'
                  : 'text-[var(--text-tertiary)]',
              )}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Racha de lectura
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {streak} {streak === 1 ? 'día' : 'días'}{' '}
              {alreadyReadToday ? '✓ Hoy ya leíste' : '— ¡Lee hoy!'}
            </p>
          </div>
        </div>

        {/* Freeze button */}
        {onUseFreeze && (
          <button
            onClick={onUseFreeze}
            disabled={freezesAvailable === 0 || freezeLoading}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              freezesAvailable > 0
                ? 'bg-[var(--info)]/10 text-[var(--info)] hover:bg-[var(--info)]/20'
                : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] cursor-not-allowed',
            )}
          >
            {freezeLoading ? (
              <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
            ) : (
              <Snowflake className="w-3.5 h-3.5" />
            )}
            {freezesAvailable > 0
              ? `${freezesAvailable} freeze${freezesAvailable !== 1 ? 's' : ''}`
              : 'Sin freezes'}
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="relative overflow-hidden">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          <div className="flex" style={{ width: `${weeksToShow * 16}px` }}>
            {months
              .filter(
                (m) =>
                  m.week >= scrollOffset &&
                  m.week < scrollOffset + weeksToShow,
              )
              .map((m, i) => (
                <span
                  key={i}
                  className="text-[10px] text-[var(--text-tertiary)]"
                  style={{
                    position: 'absolute',
                    left: `${(m.week - scrollOffset) * 16 + 8}px`,
                  }}
                >
                  {m.label}
                </span>
              ))}
          </div>
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1.5">
            {DAY_LABELS.map((label, i) => (
              <span
                key={i}
                className={cn(
                  'text-[9px] leading-[12px] h-3 w-7 text-right pr-1',
                  i % 2 === 0
                    ? 'text-[var(--text-tertiary)]'
                    : 'text-[var(--text-tertiary)]/0',
                )}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-0.5 relative">
            {visibleWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell, di) => {
                  if (!cell) {
                    return <div key={`empty-${wi}-${di}`} className="w-3 h-3" />;
                  }

                  return (
                    <div
                      key={cell.date}
                      className={cn(
                        'w-3 h-3 rounded-sm transition-colors',
                        getIntensityColor(cell.hasRead, cell.isToday, cell.isFuture),
                      )}
                      role="gridcell"
                      aria-label={
                        cell.isFuture
                          ? `${cell.date} — futuro`
                          : cell.hasRead
                            ? `${cell.date} — leído`
                            : `${cell.date} — no leído`
                      }
                      title={
                        cell.isFuture
                          ? cell.date
                          : cell.hasRead
                            ? `Leído: ${cell.date}`
                            : `Sin leer: ${cell.date}`
                      }
                    />
                  );
                })}
              </div>
            ))}

            {/* Scroll buttons */}
            {maxScroll > 0 && (
              <>
                {scrollOffset > 0 && (
                  <button
                    onClick={() => setScrollOffset(Math.max(0, scrollOffset - 4))}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3 text-[var(--text-secondary)]" />
                  </button>
                )}
                {scrollOffset < maxScroll && (
                  <button
                    onClick={() =>
                      setScrollOffset(Math.min(maxScroll, scrollOffset + 4))
                    }
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-sm bg-[var(--surface-sunken)]" />
          <div className="w-3 h-3 rounded-sm bg-[var(--accent-green)]/30" />
          <div className="w-3 h-3 rounded-sm bg-[var(--accent-green)]/50" />
          <div className="w-3 h-3 rounded-sm bg-[var(--accent-green)]/70" />
          <div className="w-3 h-3 rounded-sm bg-[var(--accent-green)]" />
          <span>Más</span>
        </div>

        {freezesAvailable > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--info)]">
            <Lock className="w-3 h-3" />
            <span>
              {freezesAvailable} freeze{freezesAvailable !== 1 ? 's' : ''}{' '}
              disponible{freezesAvailable !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Format a Date to YYYY-MM-DD */
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
