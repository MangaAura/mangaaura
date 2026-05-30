'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import {
  Heart,
  MessageSquare,
  BookOpen,
  Trophy,
  Users,
  Star,
  Plus,
  Crown,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { extractApiError } from '@/lib/extract-api-error';
import { cn } from '@/lib/utils';


interface Activity {
  id: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'READING' | 'ACHIEVEMENT' | 'COLLECTION' | 'JOIN_CLAN' | 'CREATE_MANGA';
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  targetUser?: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
  manga?: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  } | null;
  chapter?: {
    id: string;
    chapterNumber: number;
    title: string | null;
  } | null;
  achievement?: {
    id: string;
    name: string;
    icon: string;
  } | null;
  collection?: {
    id: string;
    name: string;
  } | null;
  clan?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  userId?: string;
  type?: 'personal' | 'following' | 'global';
  limit?: number;
}

const activityConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  FOLLOW: { icon: Users, color: 'text-[var(--accent-purple)]', bgColor: 'bg-[var(--accent-purple)]/20' },
  LIKE: { icon: Heart, color: 'text-[var(--error)]', bgColor: 'bg-[var(--error)]/20' },
  COMMENT: { icon: MessageSquare, color: 'text-[var(--info)]', bgColor: 'bg-[var(--info)]/20' },
  READING: { icon: BookOpen, color: 'text-[var(--success)]', bgColor: 'bg-[var(--success)]/20' },
  ACHIEVEMENT: { icon: Trophy, color: 'text-[var(--warning)]', bgColor: 'bg-[var(--warning)]/20' },
  COLLECTION: { icon: Star, color: 'text-[var(--accent-purple)]', bgColor: 'bg-[var(--accent-purple)]/20' },
  JOIN_CLAN: { icon: Crown, color: 'text-[var(--accent-orange)]', bgColor: 'bg-[var(--accent-orange)]/20' },
  CREATE_MANGA: { icon: Plus, color: 'text-[var(--primary)]', bgColor: 'bg-[var(--primary)]/20' },
};

export function ActivityFeed({ userId, type = 'following', limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('type', type);
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/feed?${params}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      const newActivities = data.activities || [];

      if (page === 1) {
        setActivities(newActivities);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
      }

      setHasMore(newActivities.length === limit);
    } catch (error) {
      handleError(error);
      setFetchError('Error al cargar actividades');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, type, userId]);

  useEffect(() => {
    let mounted = true;
    if (mounted) queueMicrotask(() => { void fetchActivities(); });
    return () => { mounted = false; };
  }, [fetchActivities]);

  const loadMore = () => {
    setPage((p) => p + 1);
  };

  const handleRetry = () => {
    setPage(1);
    setFetchError(null);
  };

  const getActivityContent = (activity: Activity) => {
    const config = activityConfig[activity.type];
    const Icon = config.icon;

    switch (activity.type) {
      case 'FOLLOW':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">siguió a</span>
            <Link
              href={`/user/${activity.targetUser?.username}`}
              className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1"
            >
              {activity.targetUser?.displayName || activity.targetUser?.username}
            </Link>
          </>
        );

      case 'LIKE':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">le gustó</span>
            {activity.manga && (
              <Link
                href={`/manga/${activity.manga.slug}`}
                className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
              >
                {activity.manga.title}
              </Link>
            )}
          </>
        );

      case 'COMMENT':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">comentó en</span>
            {activity.manga && (
              <Link
                href={`/manga/${activity.manga.slug}`}
                className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
              >
                {activity.manga.title}
              </Link>
            )}
          </>
        );

      case 'READING':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            {activity.chapter ? (
              <>
                <span className="text-[var(--text-secondary)]">leyó</span>
                {activity.manga && (
                  <Link
                    href={`/manga/${activity.manga.slug}/chapter/${activity.chapter.chapterNumber}`}
                    className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
                  >
                    {activity.manga.title} - Cap. {activity.chapter.chapterNumber}
                  </Link>
                )}
              </>
            ) : (
              <>
                <span className="text-[var(--text-secondary)]">completó</span>
                {activity.manga && (
                  <Link
                    href={`/manga/${activity.manga.slug}`}
                    className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
                  >
                    {activity.manga.title}
                  </Link>
                )}
              </>
            )}
          </>
        );

      case 'ACHIEVEMENT':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">desbloqueó</span>
            <span className="font-medium text-[var(--text-primary)] ml-1">
              {activity.achievement?.name}
            </span>
          </>
        );

      case 'COLLECTION':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">creó la colección</span>
            <Link
              href={`/collections/${activity.collection?.id}`}
              className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
            >
              {activity.collection?.name}
            </Link>
          </>
        );

      case 'JOIN_CLAN':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">se unió al clan</span>
            <Link
              href={`/community/clan/${activity.clan?.slug}`}
              className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
            >
              {activity.clan?.name}
            </Link>
          </>
        );

      case 'CREATE_MANGA':
        return (
          <>
            <Icon className={cn('w-4 h-4 mr-2', config.color)} />
            <span className="text-[var(--text-secondary)]">publicó</span>
            {activity.manga && (
              <Link
                href={`/manga/${activity.manga.slug}`}
                className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] ml-1 truncate"
              >
                {activity.manga.title}
              </Link>
            )}
          </>
        );

      default:
        return null;
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={`activity-skeleton-${i}`} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="w-9 h-[50px] rounded" />
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="alert">
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0" aria-hidden="true" />
          <p className="text-sm text-[var(--error)]">{fetchError}</p>
        </div>
        <Button variant="outline" onClick={handleRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        title="Sin actividad"
        description="No hay actividad reciente para mostrar"
      />
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = activityConfig[activity.type];

        return (
          <Card key={activity.id} className="p-4 hover:bg-[var(--surface-sunken)]/50 transition-colors">
            <div className="flex items-start gap-4">
              <Link href={`/user/${activity.user.username}`}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activity.user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[var(--surface-sunken)]">
                    {activity.user.displayName?.[0] || activity.user.username[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1 text-sm">
                  <Link
                    href={`/user/${activity.user.username}`}
                    className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
                  >
                    {activity.user.displayName || activity.user.username}
                  </Link>
                  {getActivityContent(activity)}
                </div>

                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              {activity.manga?.coverUrl && (
                <Link
                  href={`/manga/${activity.manga.slug}`}
                  className="relative w-9 h-[50px] rounded overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)] hover:ring-[var(--primary)] transition-all"
                >
                  <Image
                    src={activity.manga.coverUrl}
                    alt={activity.manga.title}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </Link>
              )}

              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
                <config.icon className={cn('w-5 h-5', config.color)} />
              </div>
            </div>
          </Card>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} isLoading={isLoading}>
            Cargar más
          </Button>
        </div>
      )}
    </div>
  );
}
