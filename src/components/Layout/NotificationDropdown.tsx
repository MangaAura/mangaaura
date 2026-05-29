'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useT } from '@/i18n';

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
  const handleClick = () => {
    if (!notification.isRead) onMarkAsRead(notification.id);
    onClose();
  };

  const content = (
    <button
      type="button"
      onClick={handleClick}
      className={
        'w-full text-left flex items-start gap-3 p-3 hover:bg-[var(--surface-elevated)] transition-colors' +
        (!notification.isRead ? ' bg-[var(--primary-subtle)]/30' : '')
      }
    >
      <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className={'text-sm' + (!notification.isRead ? ' font-medium text-[var(--text-primary)]' : '')}>
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
          {notification.message}
        </p>
      </div>
    </button>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={handleClick}
        className={
          'flex items-start gap-3 p-3 hover:bg-[var(--surface-elevated)] transition-colors' +
          (!notification.isRead ? ' bg-[var(--primary-subtle)]/30' : '')
        }
      >
        <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={'text-sm' + (!notification.isRead ? ' font-medium text-[var(--text-primary)]' : '')}>
            {notification.title}
          </p>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
            {notification.message}
          </p>
        </div>
      </Link>
    );
  }

  return content;
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    const fetchNotifs = async (showLoading = false) => {
      try {
        if (showLoading) setFetchError(null);
        const res = await fetch('/api/notifications?limit=5');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setNotifications(data.notifications || []);
      } catch {
        if (!cancelled && showLoading) setFetchError(t('notifications.fetchError'));
      } finally {
        if (!cancelled && showLoading) setIsLoading(false);
      }
    };
    fetchNotifs(true);
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(() => fetchNotifs(false), 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      console.info('[Navbar] Failed to mark notification as read');
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
        <h3 className="font-semibold text-sm text-[var(--text-primary)]">{t('notifications.title')}</h3>
        {notifications.some((n) => !n.isRead) && (
<button
          onClick={markAllAsRead}
          className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
          aria-label={t('notifications.markAllRead')}
        >
          {t('notifications.markAllRead')}
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
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4"
          >
            <ErrorMessage
              message={fetchError}
              onDismiss={() => setFetchError(null)}
            />
          </motion.div>
        </AnimatePresence>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">{t('notifications.empty')}</p>
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
          {t('notifications.viewAll')}
          </Link>
        </>
      )}
    </div>
  );
}
