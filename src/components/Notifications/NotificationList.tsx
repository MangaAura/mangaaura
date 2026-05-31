/**
 * NotificationList Component
 * 
 * Lista paginada de notificaciones con agrupación por fecha.
 * Incluye filtros, marcar todas como leídas y empty state.
 */

'use client';

import { Loader2, Filter } from 'lucide-react';
import { useRef, useCallback } from 'react';

import { EmptyState } from './EmptyState';
import { NotificationCard } from './NotificationCard';
import type { Notification, NotificationType } from '@/core/services/NotificationService';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  filterType?: NotificationType | 'all';
  onFilterChange?: (type: NotificationType | 'all') => void;
}

const filterOptions: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'NEW_CHAPTER', label: 'Capítulos' },
  { value: 'COMMENT_REPLY', label: 'Respuestas' },
  { value: 'MENTION', label: 'Menciones' },
  { value: 'ACHIEVEMENT_UNLOCKED', label: 'Logros' },
  { value: 'LEVEL_UP', label: 'Niveles' },
  { value: 'AURA_RECEIVED', label: 'Aura' },
  { value: 'SPONSORSHIP_WON', label: 'Patrocinios' },
  { value: 'SYSTEM', label: 'Sistema' },
];

export function NotificationList({
  notifications,
  isLoading,
  hasMore,
  onLoadMore,
  onMarkAsRead,
  onDelete,
  filterType = 'all',
  onFilterChange,
}: NotificationListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    });

    if (node) {
      observerRef.current.observe(node);
    }

    loadMoreRef.current = node;
  }, [hasMore, isLoading, onLoadMore]);

  // Group by date
  const grouped = notifications.reduce((acc, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    let group = 'Anteriores';
    if (date.toDateString() === today.toDateString()) {
      group = 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Ayer';
    } else if (date >= thisWeek) {
      group = 'Esta semana';
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const groups = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores'];

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState 
        hasFilters={filterType !== 'all'}
        onClearFilters={() => onFilterChange?.('all')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Type Filter */}
        {onFilterChange && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
            {filterOptions.map((option) => {
              const count = option.value === 'all'
                ? notifications.length
                : notifications.filter((n) => n.type === option.value).length;
              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    filterType === option.value
                      ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {option.label}
                  {count > 0 && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      filterType === option.value
                        ? 'bg-[var(--primary-light)]/30'
                        : 'bg-[var(--border)]'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications by group */}
      <div className="space-y-8">
        {groups.map((group) => {
          const groupNotifications = grouped[group];
          if (!groupNotifications?.length) return null;

          return (
            <div key={group}>
              <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-4 sticky top-0 bg-[var(--background)] py-2 z-10">
                {group}
              </h3>

              <div className="space-y-2">
                {groupNotifications.map((notification, i) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    index={i}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div ref={setLoadMoreRef} className="flex justify-center py-4">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm transition-colors"
            >
              Cargar más
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationList;
