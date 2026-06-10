'use client';

import { format, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────

interface ScheduleItem {
  id: string;
  chapterNumber: number;
  title: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  displayDate: string;
  mangaId: string;
  mangaTitle: string;
  mangaSlug: string;
  mangaCoverUrl: string | null;
}

interface ScheduleStats {
  totalScheduled: number;
  totalPublishedThisMonth: number;
  nextChapter: ScheduleItem | null;
}

interface ScheduleData {
  schedule: ScheduleItem[];
  mangas: Array<{ id: string; title: string; slug: string; coverUrl: string | null }>;
  stats: ScheduleStats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isYesterday(date)) return 'Ayer';
  return format(date, 'd MMM', { locale: es });
}

function getStatusColor(status: string, dateStr: string | null): string {
  if (status === 'PUBLISHED') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
  if (status === 'SCHEDULED' && dateStr) {
    const date = parseISO(dateStr);
    if (date < new Date()) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25';
    return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
  }
  return 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] border-[var(--border)]';
}

function getStatusLabel(status: string, dateStr: string | null): string {
  if (status === 'PUBLISHED') return 'Publicado';
  if (status === 'SCHEDULED' && dateStr) {
    const date = parseISO(dateStr);
    if (date < new Date()) return 'Vencido';
    return 'Programado';
  }
  return 'Borrador';
}

// ─── Schedule Card ──────────────────────────────────────────────────────

function ScheduleCard({ item, onClick }: { item: ScheduleItem; onClick?: () => void }) {
  const date = parseISO(item.displayDate);
  const statusColor = getStatusColor(item.status, item.scheduledAt);
  const statusLabel = getStatusLabel(item.status, item.scheduledAt);

  return (
    <div
      onClick={onClick}
      className="group relative flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
    >
      {/* Color indicator */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          item.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-indigo-500',
        )}
      />

      {/* Date column */}
      <div className="flex flex-col items-center min-w-[48px] pt-0.5">
        <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase">
          {format(date, 'MMM', { locale: es })}
        </span>
        <span className="text-xl font-extrabold text-[var(--text-primary)] leading-none mt-0.5">
          {format(date, 'd')}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {format(date, 'EEE', { locale: es })}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {item.mangaTitle}
          </span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', statusColor)}>
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Capítulo {item.chapterNumber}{item.title ? ` — ${item.title}` : ''}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            {item.status === 'SCHEDULED' ? (
              <Clock className="w-3 h-3" />
            ) : (
              <CalendarDays className="w-3 h-3" />
            )}
            <span>{formatDateLabel(item.displayDate)}</span>
            {item.scheduledAt && (
              <span className="text-[var(--text-muted)]">
                · {format(parseISO(item.scheduledAt), 'HH:mm')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Arrow */}
      {item.status === 'SCHEDULED' && (
        <Link
          href={`/creator/manga/${item.mangaSlug}`}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Mini Calendar ─────────────────────────────────────────────────────

function CalendarGrid({
  currentMonth,
  schedule,
  onSelectDate,
  selectedDate,
}: {
  currentMonth: Date;
  schedule: ScheduleItem[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Start from Monday
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Count items per day
  const itemsByDate = useMemo(() => {
    const map = new Map<string, { scheduled: number; published: number }>();
    for (const item of schedule) {
      const key = format(parseISO(item.displayDate), 'yyyy-MM-dd');
      const existing = map.get(key) || { scheduled: 0, published: 0 };
      if (item.status === 'SCHEDULED') existing.scheduled++;
      else existing.published++;
      map.set(key, existing);
    }
    return map;
  }, [schedule]);

  return (
    <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-lg overflow-hidden">
      {/* Day headers */}
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
        <div
          key={day}
          className="bg-[var(--surface)] px-2 py-1.5 text-center text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
        >
          {day}
        </div>
      ))}

      {/* Day cells */}
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const counts = itemsByDate.get(key);
        const isCurrentMonth = isSameMonth(day, currentMonth);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const today = isToday(day);

        return (
          <button
            key={key}
            onClick={() => onSelectDate(day)}
            className={cn(
              'relative bg-[var(--surface)] px-1.5 py-2 text-center transition-colors min-h-[52px]',
              !isCurrentMonth && 'opacity-40',
              isSelected && 'bg-indigo-500/10',
              today && 'ring-1 ring-inset ring-indigo-500/40',
              'hover:bg-[var(--surface-elevated)]',
            )}
          >
            <span
              className={cn(
                'text-xs font-medium',
                today ? 'text-indigo-500' : 'text-[var(--text-secondary)]',
                !isCurrentMonth && 'text-[var(--text-muted)]',
              )}
            >
              {format(day, 'd')}
            </span>
            {counts && (
              <div className="flex justify-center gap-0.5 mt-1">
                {counts.scheduled > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
                {counts.published > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

interface EditorialCalendarProps {
  mangaId?: string;
}

export function EditorialCalendar({ mangaId }: EditorialCalendarProps) {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [fetchKey, setFetchKey] = useState(0);

  const retry = () => {
    setFetchKey((k) => k + 1);
    setError(null);
    setIsLoading(true);
  };

  useEffect(() => {
    let cancelled = false;

    const loadSchedule = async () => {
      try {
        const from = subMonths(currentMonth, 1);
        const to = addMonths(currentMonth, 2);
        const params = new URLSearchParams({
          from: from.toISOString(),
          to: to.toISOString(),
        });
        if (mangaId) params.append('mangaId', mangaId);
        const res = await fetch(`/api/creator/schedule?${params.toString()}`);
        if (!res.ok) throw new Error('Error al cargar calendario');
        const data = await res.json();
        if (!cancelled) setScheduleData(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSchedule();
    return () => { cancelled = true; };
  }, [currentMonth, mangaId, fetchKey]);

  const filteredSchedule = useMemo(() => {
    if (!scheduleData) return [];
    if (!selectedDate) return scheduleData.schedule;

    return scheduleData.schedule.filter((item) =>
      isSameDay(parseISO(item.displayDate), selectedDate),
    );
  }, [scheduleData, selectedDate]);

  const todayItems = useMemo(() => {
    if (!scheduleData) return [];
    const today = new Date();
    return scheduleData.schedule.filter((item) =>
      isSameDay(parseISO(item.displayDate), today),
    );
  }, [scheduleData]);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {scheduleData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Programados</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {scheduleData.stats.totalScheduled}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Publicados este mes</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {scheduleData.stats.totalPublishedThisMonth}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Próximo</span>
            </div>
            {scheduleData.stats.nextChapter ? (
              <div className="text-[var(--text-primary)]">
                <p className="text-sm font-semibold truncate">
                  Cap. {scheduleData.stats.nextChapter.chapterNumber}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {scheduleData.stats.nextChapter.mangaTitle}
                  {' · '}
                  {formatDateLabel(scheduleData.stats.nextChapter.displayDate)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">—</p>
            )}
          </div>
        </div>
      )}

      {/* View toggle + month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'timeline'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            )}
          >
            <List size={14} />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'calendar'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            )}
          >
            <CalendarDays size={14} />
            Calendario
          </button>
        </div>

        {viewMode === 'calendar' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-[var(--error)] font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && scheduleData && scheduleData.schedule.length === 0 && (
        <div className="border border-dashed border-[var(--border-strong)] rounded-xl p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            No hay capítulos en el calendario
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-6 max-w-md mx-auto">
            Programa tus capítulos para mantener un ritmo de publicación constante y tus lectores al tanto.
          </p>
          <Link href="/creator/upload">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Subir nuevo capítulo
            </Button>
          </Link>
        </div>
      )}

      {/* Timeline view */}
      {!isLoading && !error && scheduleData && scheduleData.schedule.length > 0 && viewMode === 'timeline' && (
        <div className="space-y-1">
          {/* Today's items highlight */}
          {todayItems.length > 0 && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-500 mb-3">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Hoy</span>
              </div>
              <div className="space-y-2">
                {todayItems.map((item) => (
                  <ScheduleCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming items */}
          <div className="space-y-2">
            {filteredSchedule
              .filter((item) => !todayItems.includes(item))
              .map((item, index) => {
                const prevDate = index > 0 ? filteredSchedule[index - 1].displayDate : null;
                const currentDate = item.displayDate;
                const showDateSeparator = !prevDate || !isSameDay(parseISO(prevDate), parseISO(currentDate));

                return (
                  <div key={item.id}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-3 py-2 mt-2 first:mt-0">
                        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                          {formatDateLabel(currentDate)}
                        </span>
                        <div className="flex-1 h-px bg-[var(--border)]" />
                      </div>
                    )}
                    <ScheduleCard
                      item={item}
                      onClick={() => {
                        setViewMode('calendar');
                        setCurrentMonth(parseISO(item.displayDate));
                        setSelectedDate(parseISO(item.displayDate));
                      }}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Calendar view */}
      {!isLoading && !error && scheduleData && scheduleData.schedule.length > 0 && viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarGrid
              currentMonth={currentMonth}
              schedule={scheduleData.schedule}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCurrentMonth(date);
              }}
              selectedDate={selectedDate}
            />
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Programado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Publicado
              </div>
            </div>
          </div>

          {/* Selected date details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                : 'Selecciona un día'}
            </h4>
            {filteredSchedule.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)]">
                {selectedDate ? 'No hay capítulos en esta fecha' : 'Haz clic en un día del calendario'}
              </p>
            )}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredSchedule.map((item) => (
                <ScheduleCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorialCalendar;
