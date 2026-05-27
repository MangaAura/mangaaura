'use client';

import { formatDistanceToNow, isToday, isThisWeek, isThisMonth } from 'date-fns';
import type { Locale } from 'date-fns';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  Trophy,
  Star,
  Activity,
  MessageSquare,
  Share2,
  TrendingUp,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface ActivityItem {
  id: string;
  activityType: string;
  metadata: string | null;
  createdAt: Date | string;
}

interface ProfileTimelineProps {
  activities: ActivityItem[];
  t: (key: string, params?: Record<string, string | number>) => string;
  dateLocale: Locale;
}

const activityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; labelKey: string; accentColor: string }> = {
  READ_CHAPTER: { icon: BookOpen, labelKey: 'userProfile.activity.readChapter', accentColor: 'border-l-blue-500' },
  FOLLOW_USER: { icon: Users, labelKey: 'userProfile.activity.followUser', accentColor: 'border-l-green-500' },
  FOLLOW_MANGA: { icon: Bookmark, labelKey: 'userProfile.activity.followManga', accentColor: 'border-l-emerald-500' },
  COMMENT: { icon: MessageSquare, labelKey: 'userProfile.activity.comment', accentColor: 'border-l-orange-500' },
  ACHIEVEMENT: { icon: Trophy, labelKey: 'userProfile.activity.achievement', accentColor: 'border-l-yellow-500' },
  CREATE_MANGA: { icon: Star, labelKey: 'userProfile.activity.createManga', accentColor: 'border-l-purple-500' },
  LEVEL_UP: { icon: TrendingUp, labelKey: 'userProfile.activity.levelUp', accentColor: 'border-l-amber-500' },
  UNFOLLOW_USER: { icon: Users, labelKey: 'userProfile.activity.unfollowUser', accentColor: 'border-l-gray-500' },
  UNFOLLOW_MANGA: { icon: Bookmark, labelKey: 'userProfile.activity.unfollowManga', accentColor: 'border-l-gray-500' },
  SHARE_MANGA: { icon: Share2, labelKey: 'userProfile.activity.shareManga', accentColor: 'border-l-teal-500' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
};

export function ProfileTimeline({ activities, t, dateLocale }: ProfileTimelineProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title={t('userProfile.empty.activity.title')}
        description={t('userProfile.empty.activity.description')}
        icon={<Activity className="w-12 h-12 text-[var(--text-tertiary)]" />}
      />
    );
  }

  const grouped: { label: string; items: ActivityItem[] }[] = [];
  const today: ActivityItem[] = [];
  const thisWeek: ActivityItem[] = [];
  const thisMonth: ActivityItem[] = [];
  const older: ActivityItem[] = [];

  for (const a of activities) {
    const d = new Date(a.createdAt);
    if (isToday(d)) today.push(a);
    else if (isThisWeek(d)) thisWeek.push(a);
    else if (isThisMonth(d)) thisMonth.push(a);
    else older.push(a);
  }

  if (today.length) grouped.push({ label: t('userProfile.timeLabels.today'), items: today });
  if (thisWeek.length) grouped.push({ label: t('userProfile.timeLabels.thisWeek'), items: thisWeek });
  if (thisMonth.length) grouped.push({ label: t('userProfile.timeLabels.thisMonth'), items: thisMonth });
  if (older.length) grouped.push({ label: t('userProfile.timeLabels.older'), items: older });

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
          </div>

          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {group.items.map((activity) => {
              const config = activityConfig[activity.activityType] || {
                icon: Activity,
                labelKey: activity.activityType,
                accentColor: 'border-l-gray-500',
              };
              const Icon = config.icon;

              let metadata = '';
              let metadataHref = '';
              if (activity.metadata) {
                try {
                  const m = JSON.parse(activity.metadata);
                  metadata = m.title || m.name || '';
                  metadataHref = m.slug ? `/manga/${m.slug}` : '';
                } catch { /* noop */ }
              }

              const accentColor = config.accentColor;

              return (
                <motion.div key={activity.id} variants={itemVariants}>
                  <Card className={`border-l-2 ${accentColor} pl-4 py-3 pr-4 bg-[var(--surface)]/50 hover:bg-[var(--surface)] transition-colors`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--surface-sunken)] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)]">
                          {t(config.labelKey)}
                          {metadata && (
                            <>
                              {' '}
                              {metadataHref ? (
                                <Link
                                  href={metadataHref}
                                  className="font-medium text-[var(--primary)] hover:underline"
                                >
                                  {metadata}
                                </Link>
                              ) : (
                                <span className="font-medium text-[var(--text-secondary)]">
                                  {metadata}
                                </span>
                              )}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
