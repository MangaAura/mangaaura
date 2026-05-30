'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, MessageSquare, Heart, Trophy, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';


interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface NotificationBellProps {
  userId: string;
}

function getIcon(type: string) {
  switch (type) {
    case 'FOLLOW':
      return <Heart className="w-4 h-4 text-[var(--accent-purple)]" />;
    case 'COMMENT':
    case 'REPLY':
      return <MessageSquare className="w-4 h-4 text-[var(--info)]" />;
    case 'ACHIEVEMENT':
      return <Trophy className="w-4 h-4 text-[var(--warning)]" />;
    case 'REPORT_CREATED':
    case 'REPORT_RESOLVED':
      return <AlertCircle className="w-4 h-4 text-[var(--warning)]" />;
    default:
      return <Bell className="w-4 h-4 text-[var(--text-secondary)]" />;
  }
}

export function NotificationBell({}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { handleError } = useErrorHandler();
  const t = useT();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=5');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void fetchNotifications(); });
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      handleError(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--error)] rounded-full text-xs font-bold text-[var(--text-primary)] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`notif-skeleton-${i}`} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)] text-sm">{t('notifications.empty')}</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                getIcon={getIcon}
              />
            ))}
            <Link
              href="/notifications"
              className="block p-3 text-center text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] border-t border-[var(--border)]"
              onClick={() => setIsOpen(false)}
            >
              {t('notifications.viewAll')}
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  getIcon,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
}) {
  const handleClick = () => {
    if (!notification.isRead) onMarkAsRead(notification.id);
  };

  const content = (
    <div
      onClick={handleClick}
      className={cn(
'flex items-start gap-3 p-3 hover:bg-[var(--surface-sunken)]/50 transition-colors cursor-pointer',
    !notification.isRead && 'bg-[var(--surface-sunken)]/30'
      )}
    >
      {notification.sender ? (
        <Avatar className="w-10 h-10">
          <AvatarImage src={notification.sender.avatarUrl || undefined} />
          <AvatarFallback className="bg-[var(--surface-sunken)] text-xs">
            {notification.sender.displayName?.[0] ||
              notification.sender.username[0]}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
          {getIcon(notification.type)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.isRead && 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] line-clamp-1">
          {notification.message}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>
      {!notification.isRead && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkAsRead(notification.id); }}
              className="p-1 hover:bg-[var(--surface-sunken)] rounded cursor-pointer"
              aria-label="Marcar como leída"
            >
          <X className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
      )}
    </div>
  );

  if (notification.linkUrl) {
    return (
      <Link
        href={notification.linkUrl}
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return content;
}
