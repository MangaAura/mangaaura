/**
 * NotificationCard Component
 * 
 * Tarjeta individual de notificación con icono, contenido y acciones.
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
} as const;

export function NotificationCard({ 
  notification, 
  onMarkAsRead,
  onDelete,
  index = 0,
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
      return 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]';
    case 'COMMENT_REPLY':
    case 'MENTION':
      return 'bg-[var(--success)]/20 text-[var(--success)]';
    case 'ACHIEVEMENT_UNLOCKED':
    case 'LEVEL_UP':
      return 'bg-[var(--warning)]/20 text-[var(--warning)]';
    case 'INK_COINS_RECEIVED':
    case 'SPONSORSHIP_WON':
      return 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]';
    default:
      return 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]';
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
      
    if (data.chapterId && data.mangaId) {
      router.push(`/reader?mangaId=${data.mangaId}&chapterId=${data.chapterId}`);
    } else if (data.mangaId) {
      router.push(`/manga/${data.mangaId}`);
    } else if (data.chapterId) {
      router.push(`/manga/${data.chapterId}`);
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
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      onClick={handleClick}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors group',
        notification.isRead
          ? 'bg-[var(--surface)]/50 hover:bg-[var(--surface)] hover:shadow-sm'
          : 'bg-[var(--primary-subtle)]/40 hover:bg-[var(--primary-subtle)]/70 shadow-[0_0_0_1px_var(--primary-subtle)]'
      )}
    >
      {/* Unread dot indicator */}
      {!notification.isRead && (
        <span className="absolute top-4 left-4 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
      )}

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
              notification.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-semibold'
            )}>
              {notification.title}
            </p>
            <p className={cn(
              'text-sm mt-0.5',
              notification.isRead ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'
            )}>
              {notification.message}
            </p>
          </div>
          <span className={cn(
            'text-xs whitespace-nowrap mt-0.5',
            notification.isRead ? 'text-[var(--text-tertiary)]/70' : 'text-[var(--text-tertiary)] font-medium'
          )}>
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
                    <span className="text-xs bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] px-2 py-1 rounded">
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!notification.isRead && onMarkAsRead && (
          <button
            onClick={handleMarkAsRead}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--surface)] cursor-pointer"
            title="Marcar como leída"
            aria-label="Marcar como leída"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--surface)] cursor-pointer"
            title="Eliminar"
            aria-label="Eliminar notificación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default NotificationCard;
