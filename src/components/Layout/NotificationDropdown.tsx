'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}) {
  const content = (
    <div
      className={
        'flex items-start gap-3 p-3 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer' +
        (!notification.isRead ? ' bg-[var(--primary-subtle)]/30' : '')
      }
      onClick={() => {
        if (!notification.isRead) onMarkAsRead(notification.id);
        if (notification.link) onClose();
      }}
    >
      <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={'text-sm' + (!notification.isRead ? ' font-medium text-[var(--text-primary)]' : '')}>
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
          {notification.message}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchNotifs = async () => {
      try {
        setFetchError(null);
        const res = await fetch('/api/notifications?limit=5');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNotifications(data.notifications || []);
      } catch {
        if (!cancelled) setFetchError('Error al cargar notificaciones');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchNotifs();
    return () => { cancelled = true; };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      console.info('[Navbar] Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      console.info('[Navbar] Failed to mark all as read');
    }
  };

  return (
    <div className="w-80 max-h-96 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl animate-in fade-in-0 slide-in-from-top-1 duration-150">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notificaciones</h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
          >
            Marcar todas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={`notif-skeleton-${i}`} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)]" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-[var(--surface-elevated)] rounded w-3/4" />
                <div className="h-2 bg-[var(--surface-elevated)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="p-4 text-center" role="alert">
          <p className="text-sm text-[var(--error)]">{fetchError}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Sin notificaciones</p>
        </div>
      ) : (
        <>
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onClose={onClose}
            />
          ))}
          <Link
            href="/notifications"
            className="block p-3 text-center text-sm text-[var(--primary)] hover:underline border-t border-[var(--border)]"
            onClick={onClose}
          >
            Ver todas
          </Link>
        </>
      )}
    </div>
  );
}
