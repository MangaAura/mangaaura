/**
 * NotificationCard Component
 * 
 * Tarjeta individual de notificación con icono, contenido y acciones.
 */

'use client';

import { useRouter } from 'next/navigation';
import { 
  Bell, 
  BookOpen, 
  MessageSquare, 
  Trophy, 
  Star, 
  Coins, 
  Gift, 
  AtSign,
  Check,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import type { Notification } from '@/core/services/NotificationService';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationCard({ 
  notification, 
  onMarkAsRead,
  onDelete 
}: NotificationCardProps) {
  const router = useRouter();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_CHAPTER':
        return <BookOpen className="w-5 h-5" />;
      case 'COMMENT_REPLY':
        return <MessageSquare className="w-5 h-5" />;
      case 'MENTION':
        return <AtSign className="w-5 h-5" />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <Trophy className="w-5 h-5" />;
      case 'LEVEL_UP':
        return <Star className="w-5 h-5" />;
      case 'INK_COINS_RECEIVED':
        return <Coins className="w-5 h-5" />;
      case 'SPONSORSHIP_WON':
        return <Gift className="w-5 h-5" />;
      case 'SYSTEM':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
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

  const handleClick = () => {
    // Marcar como leída
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navegar
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
      } else if (data.achievementId) {
        router.push('/achievements');
      }
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all group',
        notification.isRead
          ? 'bg-[var(--surface)]/50 hover:bg-[var(--surface)]'
          : 'bg-[var(--primary-subtle)]/30 hover:bg-[var(--primary-subtle)]/50 border-l-4 border-[var(--primary)]'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        getNotificationColor(notification.type)
      )}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn(
              'text-sm',
              notification.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'
            )}>
              {notification.title}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {notification.message}
            </p>
          </div>
          <span className="text-xs text-[var(--text-tertiary)]/70 whitespace-nowrap">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>

        {/* Data display */}
        {notification.data && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(() => {
              const data = typeof notification.data === 'string' 
                ? JSON.parse(notification.data) 
                : notification.data;
              
              return (
                <>
                  {data.replierName && (
                    <span className="text-xs bg-[var(--surface)] px-2 py-1 rounded text-[var(--text-secondary)]">
                      {data.replierName}
                    </span>
                  )}
                  {data.mentionerName && (
                    <span className="text-xs bg-[var(--surface)] px-2 py-1 rounded text-[var(--text-secondary)]">
                      {data.mentionerName}
                    </span>
                  )}
                  {data.mangaTitle && (
                    <span className="text-xs bg-[var(--surface)] px-2 py-1 rounded text-[var(--text-secondary)]">
                      {data.mangaTitle}
                    </span>
                  )}
                  {data.amount && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                      +{data.amount}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && onMarkAsRead && (
          <button
            onClick={handleMarkAsRead}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--surface)]"
            title="Marcar como leída"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 text-[var(--text-tertiary)] hover:text-red-400 rounded-lg hover:bg-[var(--surface)]"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationCard;
