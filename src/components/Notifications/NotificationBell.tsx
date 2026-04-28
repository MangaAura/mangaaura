/**
 * NotificationBell Component
 * 
 * Componente de campana de notificaciones con dropdown.
 * Muestra el contador de no leídas y permite acceder rápidamente a las notificaciones.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { cn, formatTimeAgo } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ limit: 10 });

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navegar según el tipo
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    } else if (notification.data) {
      const data = typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data;
      
      if (data.chapterId) {
        router.push(`/chapter/${data.chapterId}`);
      } else if (data.mangaId) {
        router.push(`/manga/${data.mangaId}`);
      }
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_CHAPTER':
        return '📖';
      case 'COMMENT_REPLY':
        return '💬';
      case 'MENTION':
        return '@️';
      case 'ACHIEVEMENT_UNLOCKED':
        return '🏆';
      case 'LEVEL_UP':
        return '⭐';
      case 'INK_COINS_RECEIVED':
        return '💰';
      case 'SPONSORSHIP_WON':
        return '🎉';
      case 'SYSTEM':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_CHAPTER':
        return 'bg-blue-500/20 text-blue-400';
      case 'COMMENT_REPLY':
      case 'MENTION':
        return 'bg-green-500/20 text-green-400';
      case 'ACHIEVEMENT_UNLOCKED':
      case 'LEVEL_UP':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'INK_COINS_RECEIVED':
      case 'SPONSORSHIP_WON':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen ? 'bg-[var(--surface)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
        )}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge de conteo */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Marcar todo
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-[var(--text-secondary)] text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'px-4 py-3 cursor-pointer hover:bg-[var(--surface)]/50 transition-colors group',
                      !notification.isRead && 'bg-[var(--primary-subtle)]/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0',
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm',
                          !notification.isRead ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)]/70 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--primary)] rounded"
                            title="Marcar como leída"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Indicador de no leída */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[var(--primary)] rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface)]/50">
            <button
              onClick={() => {
                router.push('/notifications');
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1"
            >
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
