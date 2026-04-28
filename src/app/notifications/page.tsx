/**
 * Notifications Page
 * 
 * Página completa de notificaciones con filtros, lista paginada
 * y acciones de gestión.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2, Filter } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from '@/components/Notifications/NotificationList';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Layout/Navbar';
import type { NotificationType } from '@/core/services/NotificationService';

type FilterType = NotificationType | 'all';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications({
    limit: 20,
    enablePolling: true,
    pollingInterval: 30000,
  });

  // Filter notifications by type
  const filteredNotifications = filterType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login?callbackUrl=/notifications');
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 rounded-xl">
                <Bell className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  Notificaciones
                </h1>
                <p className="text-[var(--text-secondary)]">
                  {unreadCount > 0
                    ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                    : 'No tienes notificaciones pendientes'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Marcar todas como leídas
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  showFilters
                    ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                )}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>
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
    </div>
  );
}
