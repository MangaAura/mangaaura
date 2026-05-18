/**
 * useNotifications Hook
 * 
 * Hook para gestionar notificaciones con polling cada 30 segundos.
 * Integra con NotificationService de Prisma.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';

import type { Notification, NotificationType } from '@/core/services/NotificationService';

interface NotificationFilter {
  types?: NotificationType[];
  isRead?: boolean;
}

interface UseNotificationsOptions {
  filter?: NotificationFilter;
  limit?: number;
  enablePolling?: boolean;
  pollingInterval?: number; // en milisegundos
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteReadNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMangaNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { 
    filter, 
    limit = 20, 
    enablePolling = true,
    pollingInterval = 30000 // 30 segundos por defecto
  } = options;
  
  const { data: session, status } = useSession();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Build query params
  const buildQueryParams = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      if (filter?.types && filter.types.length > 0) {
        filter.types.forEach((type) => params.append('types', type));
      }

      if (filter?.isRead !== undefined) {
        params.append('isRead', filter.isRead.toString());
      }

      return params.toString();
    },
    [filter, limit]
  );

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!session?.user?.id) return;

      const currentOffset = reset ? 0 : offsetRef.current;

      try {
        setIsLoading(true);
        const queryParams = buildQueryParams(currentOffset);
        const response = await fetch(`/api/notifications?${queryParams}`);

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        const newNotifications = data.notifications || [];

        if (reset) {
          setNotifications(newNotifications);
          offsetRef.current = newNotifications.length;
        } else {
          setNotifications((prev) => {
            // Avoid duplicates
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNew = newNotifications.filter(
              (n: Notification) => !existingIds.has(n.id)
            );
            return [...prev, ...uniqueNew];
          });
          offsetRef.current = currentOffset + newNotifications.length;
        }

        setHasMore(newNotifications.length === limit);
        setUnreadCount(data.unreadCount || 0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        isLoadingMoreRef.current = false;
      }
    },
    [session?.user?.id, buildQueryParams, limit]
  );

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/notifications/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [session?.user?.id]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return;

    isLoadingMoreRef.current = true;
    await fetchNotifications(false);
  }, [fetchNotifications, hasMore]);

  // Refetch (reset)
  const refetch = useCallback(async () => {
    offsetRef.current = 0;
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // Mark as read (optimistic update)
  const markAsRead = useCallback(async (notificationId: string) => {
    const previousNotification = notifications.find(
      (n) => n.id === notificationId
    );

    if (previousNotification?.isRead) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (err) {
      // Rollback on error
      if (previousNotification) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, isRead: previousNotification.isRead }
              : n
          )
        );
        setUnreadCount((prev) =>
          previousNotification.isRead ? prev : prev + 1
        );
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [notifications]);

  // Mark all as read (optimistic update)
  const markAllAsRead = useCallback(async () => {
    const previousUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (err) {
      // Rollback on error
      setUnreadCount(previousUnreadCount);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [unreadCount]);

  // Delete notification (optimistic update)
  const deleteNotification = useCallback(async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
    } catch (err) {
      // Rollback on error
      if (notification) {
        setNotifications((prev) => {
          if (!prev.some((n) => n.id === notificationId)) {
            return [...prev, notification];
          }
          return prev;
        });
        if (!notification.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [notifications]);

  // Delete read notifications
  const deleteReadNotifications = useCallback(async () => {
    const readNotifications = notifications.filter((n) => n.isRead);

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !n.isRead));

    try {
      // API para eliminar notificaciones leídas
      const response = await fetch('/api/notifications/read', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete read notifications');
      }
    } catch (err) {
      // Rollback on error
      setNotifications((prev) => [...prev, ...readNotifications]);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      offsetRef.current = 0;
      fetchNotifications(true);
    }
  }, [status, session?.user?.id, filter?.types, filter?.isRead]);

  // Polling cada 30 segundos
  useEffect(() => {
    if (!enablePolling || status !== 'authenticated') return;

    // Limpiar intervalo anterior si existe
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Crear nuevo intervalo
    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
      // Si hay nuevas notificaciones, refrescar la lista
      fetchNotifications(true);
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, pollingInterval, status, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    loadMore,
    refetch,
  };
}

// Hook para conteo de notificaciones (lightweight)
export function useNotificationListener(pollingInterval: number = 30000) {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/notifications/unread');
      if (response.ok) {
        const data = await response.json();
        setCount(data.unread || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCount();
    }
  }, [status, fetchCount]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(fetchCount, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [status, pollingInterval, fetchCount]);

  return count;
}

// Alias for backwards compatibility
export const useNotifications = useMangaNotifications;
export const useNotificationCount = useNotificationListener;
export default useMangaNotifications;
