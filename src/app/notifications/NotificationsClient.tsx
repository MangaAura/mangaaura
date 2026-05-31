/**
 * Notifications Page
 * 
 * Página completa de notificaciones con filtros, lista paginada
 * y acciones de gestión.
 */

'use client';

import { Bell, Check, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { NotificationList } from '@/components/Notifications/NotificationList';
import type { NotificationType } from '@/core/services/NotificationService';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

type FilterType = NotificationType | 'all';
type ReadStatus = 'all' | 'unread' | 'read';

export default function NotificationsClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [readStatus, setReadStatus] = useState<ReadStatus>('all');

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/login?callbackUrl=/notifications');
    }
  }, [session, status, router]);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
  } = useNotifications({
    limit: 20,
    enablePolling: true,
    pollingInterval: 30000,
  });

  const readCount = notifications.filter((n) => n.isRead).length;

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (readStatus === 'unread' && n.isRead) return false;
    if (readStatus === 'read' && !n.isRead) return false;
    return true;
  });

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Bell className="text-[var(--primary)]" size={30} /> Notificaciones
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                : 'No tienes notificaciones pendientes'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {readCount > 0 && (
              <button
                onClick={deleteReadNotifications}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                title="Eliminar leídas"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar leídas
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Read status tabs */}
        <div className="flex items-center gap-1 mb-6">
          {([
            { value: 'all' as ReadStatus, label: 'Todas' },
            { value: 'unread' as ReadStatus, label: 'No leídas', count: unreadCount },
            { value: 'read' as ReadStatus, label: 'Leídas', count: readCount },
          ]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setReadStatus(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                readStatus === tab.value
                  ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  readStatus === tab.value
                    ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                    : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <NotificationList
          notifications={filteredNotifications}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          filterType={filterType}
          onFilterChange={setFilterType}
        />
      </div>
    </div>
  );
}
