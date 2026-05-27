'use client';

import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, format } from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Crown,
  Flame,
  BookOpen,
  Users,
  Trophy,
  Star,
  Activity,
  Clock,
  Calendar,
  Plus,
  MessageSquare,
  Share2,
  Sparkles,
  TrendingUp,
  Eye,
  Bookmark,
  Globe,
  Camera,
  Video,
  Heart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { FollowButton } from '@/components/Social/FollowButton';
import { Avatar, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useT, useLocale } from '@/i18n';
import { FollowersModal } from '@/app/(protected)/profile/FollowersModal';
import { LibraryModal } from '@/app/(protected)/profile/LibraryModal';
import { CollectionsModal } from '@/app/(protected)/profile/CollectionsModal';
import { AchievementsModal } from '@/app/(protected)/profile/AchievementsModal';

// ─── Types ───────────────────────────────────────────────────────────────────────

interface MangaPreview {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: string;
  rating: number | null;
  totalViews: number;
  _count: { chapters: number };
}

interface ReadingProgressItem {
  id: string;
  percentage: number;
  updatedAt: Date | string;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  chapter: {
    chapterNumber: number;
  };
}

interface UserAchievement {
  id: string;
  unlockedAt: Date;
  achievement: {
    id: string;
    name: string;
    description: string;
    iconUrl: string | null;
    category: string;
    difficulty: string;
  };
}

interface ActivityItem {
  id: string;
  activityType: string;
  metadata: string | null;
  createdAt: Date | string;
}

interface UserData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
  socialLinks: string | null;
  role: string;
  emailVerified: Date | string | null;
  level: number;
  xpPoints: number;
  readingStreak: number;
  createdAt: Date | string;
  _count: {
    library: number;
    collections: number;
    following: number;
    followers: number;
    achievements: number;
    createdMangas: number;
    activitiesFeed: number;
  };
  achievements: UserAchievement[];
  createdMangas: MangaPreview[];
  readingProgress: ReadingProgressItem[];
  activitiesFeed: ActivityItem[];
  clanMemberships: { clan: { id: string; name: string; emblemUrl: string | null } }[];
  collections?: Array<{ id: string; name: string; description?: string | null; _count: { items: number; likes: number } }>;
}

interface FollowUserSummary {
  id: string;
  username: string;
  displayName: string | null;
  level: number;
  avatarUrl: string | null;
}

interface UserProfileClientProps {
  user: UserData;
  isOwnProfile: boolean;
  sessionUserId?: string;
  following: Array<{ id: string; following: FollowUserSummary; follower: FollowUserSummary }>;
  followers: Array<{ id: string; following: FollowUserSummary; follower: FollowUserSummary }>;
  libraryEntries: Array<{
    id: string;
    manga: { id: string; title: string; slug: string; coverUrl: string | null };
    status: string;
  }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getAchievementRarity(achievement: UserAchievement): { rarity: 'legendary' | 'epic' | 'rare' | 'common'; color: string; bg: string; border: string; glow: string } {
  const name = achievement.achievement.name.toLowerCase();
  const desc = achievement.achievement.description.toLowerCase();

  if (name.includes('legend') || name.includes('legendario') || name.includes('master') || name.includes('maestro') || name.includes('ultimate')) {
    return {
      rarity: 'legendary',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/30',
      glow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]',
    };
  }
  if (name.includes('épic') || name.includes('epic') || name.includes('héroe') || name.includes('hero') || name.includes('elite')) {
    return {
      rarity: 'epic',
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      border: 'border-violet-400/30',
      glow: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.2)]',
    };
  }
  if (name.includes('rare') || name.includes('especial') || name.includes('special') || name.includes('pro') || desc.length > 80) {
    return {
      rarity: 'rare',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/30',
      glow: 'hover:shadow-[0_0_16px_rgba(96,165,250,0.15)]',
    };
  }
  return {
    rarity: 'common',
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    glow: '',
  };
}

function isNewAchievement(unlockedAt: Date | string): boolean {
  const hoursAgo = (Date.now() - new Date(unlockedAt).getTime()) / (1000 * 60 * 60);
  return hoursAgo < 24;
}

// ─── Animation Variants ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} satisfies Variants;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
  },
} satisfies Variants;

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    },
  }),
} satisfies Variants;

// ─── Sub-components ────────────────────────────────────────────────────────────────

function HeroGlowAvatar({ user, t, isSpecial }: { user: UserData; t: (key: string, params?: Record<string, string | number>) => string; isSpecial: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const roleAriaLabel =
    user.role === 'ADMIN' ? t('userProfile.roles.admin') :
    user.role === 'MODERATOR' ? t('userProfile.roles.moderator') :
    t('userProfile.roles.creator');
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
    >
      {isSpecial && !shouldReduceMotion && (
        <motion.div
          className="absolute -inset-1 rounded-full"
          aria-hidden="true"
          animate={{
            boxShadow: [
              '0 0 15px rgba(245, 158, 11, 0.3), 0 0 30px rgba(245, 158, 11, 0.1)',
              '0 0 25px rgba(245, 158, 11, 0.5), 0 0 50px rgba(245, 158, 11, 0.2)',
              '0 0 15px rgba(245, 158, 11, 0.3), 0 0 30px rgba(245, 158, 11, 0.1)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <Avatar className="w-36 h-36 rounded-full ring-4 ring-[var(--surface)] shadow-xl relative z-10">
        <AvatarImage src={user.avatarUrl || undefined} className="rounded-full" />
      </Avatar>
      {isSpecial && (
        <motion.span
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 dark:bg-yellow-500 text-gray-900 flex items-center justify-center text-xs ring-2 ring-amber-600 dark:ring-yellow-600 z-20 shadow-lg"
          animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          role="img"
          aria-label={roleAriaLabel}
        >
          <Crown className="w-4 h-4" />
        </motion.span>
      )}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  index,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  index: number;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <motion.div
      custom={index}
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative overflow-hidden"
    >
      <Card className="p-4 text-center bg-[var(--surface)]/60 backdrop-blur-sm border-[var(--border)]/80 hover:shadow-lg transition-shadow duration-200">
        <motion.div
          className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 flex items-center justify-center"
          animate={{ scale: isHovered ? 1.15 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Icon
            className={`w-5 h-5 transition-colors duration-200 ${
              isHovered ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
            }`}
          />
        </motion.div>
        <p
          className={`text-xl font-bold transition-all duration-200 ${
            isHovered
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      </Card>
    </motion.div>
  );

  if (onClick) {
    return <button onClick={onClick} className="block w-full text-left cursor-pointer">{content}</button>;
  }

  return content;
}

function TimelineActivity({ activities, t, dateLocale }: { activities: ActivityItem[]; t: (key: string, params?: Record<string, string | number>) => string; dateLocale: Locale }) {
  const activityTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bgColor: string }> = {
    READ_CHAPTER: { icon: BookOpen, label: t('userProfile.activity.readChapter'), color: 'text-blue-400', bgColor: 'bg-blue-500' },
    FOLLOW_USER: { icon: Users, label: t('userProfile.activity.followUser'), color: 'text-green-400', bgColor: 'bg-green-500' },
    FOLLOW_MANGA: { icon: Bookmark, label: t('userProfile.activity.followManga'), color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
    COMMENT: { icon: MessageSquare, label: t('userProfile.activity.comment'), color: 'text-orange-400', bgColor: 'bg-orange-500' },
    ACHIEVEMENT: { icon: Trophy, label: t('userProfile.activity.achievement'), color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
    CREATE_MANGA: { icon: Star, label: t('userProfile.activity.createManga'), color: 'text-purple-400', bgColor: 'bg-purple-500' },
    LEVEL_UP: { icon: TrendingUp, label: t('userProfile.activity.levelUp'), color: 'text-amber-400', bgColor: 'bg-amber-500' },
    UNFOLLOW_USER: { icon: Users, label: t('userProfile.activity.unfollowUser'), color: 'text-gray-400', bgColor: 'bg-gray-500' },
    UNFOLLOW_MANGA: { icon: Bookmark, label: t('userProfile.activity.unfollowManga'), color: 'text-gray-400', bgColor: 'bg-gray-500' },
    SHARE_MANGA: { icon: Share2, label: t('userProfile.activity.shareManga'), color: 'text-teal-400', bgColor: 'bg-teal-500' },
  };

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
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <motion.div
            className="relative pl-8 space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[var(--border)] rounded-full" />

            {group.items.map((activity) => {
              const config = activityTypeConfig[activity.activityType] || {
                icon: Activity,
                label: activity.activityType,
                color: 'text-gray-400',
                bgColor: 'bg-gray-500',
              };
              const Icon = config.icon;
              let metadata = '';
              if (activity.metadata) {
                try {
                  const m = JSON.parse(activity.metadata);
                  metadata = m.title || m.name || '';
                } catch { /* noop */ }
              }

              return (
                <motion.div key={activity.id} variants={itemVariants} className="relative group">
                  <motion.div
                    className={`absolute -left-[20px] top-1.5 w-3 h-3 rounded-full ${config.bgColor} ring-2 ring-[var(--surface)] z-10`}
                    whileHover={{ scale: 1.5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    aria-hidden="true"
                  />

                  <Card className="p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor.replace('bg-', 'bg-')}/10 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)]">
                          {config.label}
                          {metadata && (
                            <span className="text-[var(--text-tertiary)]">
                              {' '}—{' '}
                              <span className="font-medium text-[var(--text-secondary)]">{metadata}</span>
                            </span>
                          )}
                        </p>
                        <p
                          className="text-xs text-[var(--text-tertiary)] mt-1"
                          title={format(new Date(activity.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: dateLocale })}
                        >
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

function CircularProgress({ percentage, t }: { percentage: number; t: (key: string, params?: Record<string, string | number>) => string }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 80 ? 'var(--success)' :
    percentage >= 40 ? 'var(--primary)' :
    percentage >= 15 ? 'var(--warning)' :
    'var(--error)';

  return (
    <svg
      width="36" height="36" viewBox="0 0 36 36" className="flex-shrink-0"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t('userProfile.readingProgress', { percentage })}
    >
      <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--border)" strokeWidth="3" />
      <motion.circle
        cx="18" cy="18" r={radius} fill="none" stroke={color} strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x="18" y="20" textAnchor="middle" fontSize="9" fill="currentColor" className="text-[var(--text-primary)] font-semibold">
        {percentage}%
      </text>
    </svg>
  );
}

function ReadingCard({ progress, t, dateLocale }: { progress: ReadingProgressItem; t: (key: string, params?: Record<string, string | number>) => string; dateLocale: Locale }) {
  return (
    <Link href={`/manga/${progress.manga.slug}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Card className="p-4 hover:shadow-lg transition-shadow duration-200 flex gap-4 relative overflow-hidden group">
          <div className="w-14 h-[72px] flex-shrink-0 rounded-md overflow-hidden bg-[var(--border)] relative">
            {progress.manga.coverUrl ? (
              <motion.div
                className="w-full h-full"
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Image
                  src={progress.manga.coverUrl}
                  alt={progress.manga.title}
                  width={56}
                  height={72}
                  className="object-cover w-full h-full"
                />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
                <span className="text-[var(--text-inverse)] text-xs font-bold">{progress.manga.title[0]}</span>
              </div>
            )}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2"
            >
              <span className="text-white text-xs font-medium line-clamp-2">{progress.manga.title}</span>
            </motion.div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
              {progress.manga.title}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Cap. {progress.chapter.chapterNumber}
            </p>
            <div className="flex items-center justify-between mt-1">
              <CircularProgress percentage={progress.percentage} t={t} />
              <span className="text-xs text-[var(--text-tertiary)]">
                {formatDistanceToNow(new Date(progress.updatedAt), { addSuffix: true, locale: dateLocale })}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

function AchievementCard({ ua, t, dateLocale }: { ua: UserAchievement; t: (key: string, params?: Record<string, string | number>) => string; dateLocale: Locale }) {
  const { rarity, color, bg, border, glow } = getAchievementRarity(ua);
  const isNew = isNewAchievement(ua.unlockedAt);
  const rarityIcon = rarity === 'legendary' ? '👑' : rarity === 'epic' ? '💎' : rarity === 'rare' ? '⭐' : '🏅';

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card className={`p-4 text-center transition-all duration-200 relative overflow-hidden border ${border} ${bg} ${glow}`}>
        {rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/5 to-transparent"
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {isNew && (
          <motion.div
            className="absolute -top-1 -right-1 z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            aria-label={t('userProfile.newBadge')}
          >
            <Badge className="bg-[var(--primary)] text-[var(--text-inverse)] text-[10px] px-2 py-0.5 font-semibold shadow-md">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              {t('userProfile.newBadge')}
            </Badge>
          </motion.div>
        )}
        <div className={`w-14 h-14 mx-auto mb-3 rounded-xl ${bg} flex items-center justify-center text-2xl`}>
          {rarityIcon}
        </div>
        <h4 className={`font-semibold text-sm ${color}`}>{ua.achievement.name}</h4>
        <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{ua.achievement.description}</p>
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-[var(--text-secondary)]">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(ua.unlockedAt), { addSuffix: true, locale: dateLocale })}
        </div>
      </Card>
    </motion.div>
  );
}

function MangaCreatedCard({ manga, isOwnProfile: _isOwnProfile, t }: { manga: MangaPreview; isOwnProfile: boolean; t: (key: string, params?: Record<string, string | number>) => string }) {
  const statusConfig =
    manga.status === 'ONGOING'
      ? { label: t('userProfile.mangaStatus.ongoing'), gradient: 'from-emerald-500 to-teal-500', icon: Flame }
      : manga.status === 'COMPLETED'
        ? { label: t('userProfile.mangaStatus.completed'), gradient: 'from-blue-500 to-indigo-500', icon: Star }
        : { label: t('userProfile.mangaStatus.paused'), gradient: 'from-amber-500 to-orange-500', icon: Clock };

  const StatusIcon = statusConfig.icon;

  return (
    <Link href={`/manga/${manga.slug}`}>
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.03, y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group h-full">
          <div className="aspect-[3/4] bg-[var(--border)] relative">
            {manga.coverUrl ? (
              <Image src={manga.coverUrl} alt={manga.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
                <span className="text-[var(--text-inverse)] text-4xl font-bold">{manga.title[0]}</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <Badge className={`bg-gradient-to-r ${statusConfig.gradient} text-white text-xs border-0 shadow-md flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3"
            >
              <div className="flex items-center gap-3 text-white text-xs">
                {manga.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {manga.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {manga._count.chapters} {t('userProfile.caps')}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {manga.totalViews.toLocaleString()}
                </span>
              </div>
            </motion.div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm truncate group-hover:text-[var(--primary)] transition-colors">{manga.title}</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {manga._count.chapters} {t('userProfile.caps')} · {manga.totalViews.toLocaleString()} {t('userProfile.views')}
            </p>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────────

export function UserProfileClient({ user, isOwnProfile, sessionUserId, following, followers, libraryEntries }: UserProfileClientProps) {
  const t = useT();
  const { locale } = useLocale();
  const dateLocale = locale === 'es' ? es : enUS;
  const shouldReduceMotion = useReducedMotion();
  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min(100, (user.xpPoints / xpForNextLevel) * 100);

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  const stats = [
    { icon: BookOpen, label: t('userProfile.stats.mangas'), value: user._count.library, onClick: () => setLibraryModalOpen(true) },
    { icon: Users, label: t('userProfile.stats.following'), value: user._count.following, onClick: () => setFollowModalOpen(true) },
    { icon: Heart, label: t('userProfile.stats.followers'), value: user._count.followers, onClick: () => setFollowModalOpen(true) },
    { icon: Trophy, label: t('userProfile.stats.achievements'), value: user._count.achievements, onClick: () => setAchievementsModalOpen(true) },
    { icon: Flame, label: t('userProfile.stats.streak'), value: t('userProfile.stats.streakDays', { count: user.readingStreak }) },
    ...(user._count.createdMangas > 0
      ? [{ icon: Star, label: t('userProfile.stats.created'), value: user._count.createdMangas, onClick: () => {} }]
      : []),
  ];

  const roleLabel =
    user.role === 'ADMIN' ? t('userProfile.roles.admin') : user.role === 'MODERATOR' ? t('userProfile.roles.moderator') : null;

  const roleBadgeStyle =
    user.role === 'ADMIN'
      ? 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20'
      : 'bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20';

  const memberSince = format(new Date(user.createdAt), "MMMM 'de' yyyy", { locale: dateLocale });

  const socialConfig: Record<string, { icon: React.ReactNode; label: string; brandColor: string }> = {
    twitter: {
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      label: 'X',
      brandColor: 'hover:text-black dark:hover:text-white',
    },
    instagram: {
      icon: <Camera className="w-3.5 h-3.5" />,
      label: 'Instagram',
      brandColor: 'hover:text-pink-500',
    },
    youtube: {
      icon: <Video className="w-3.5 h-3.5" />,
      label: 'YouTube',
      brandColor: 'hover:text-red-500',
    },
    tiktok: {
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
      label: 'TikTok',
      brandColor: 'hover:text-black dark:hover:text-white',
    },
    discord: {
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
        </svg>
      ),
      label: 'Discord',
      brandColor: 'hover:text-indigo-400',
    },
  };

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-[var(--primary)]/15 via-[var(--accent-purple)]/8 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative">
        <div className="max-w-5xl mx-auto">
          {/* ═══════ Profile Header ═══════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Card className="p-6 mb-8 relative overflow-hidden border-[var(--border)]/80 bg-[var(--surface)]/70 backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/[0.04] via-transparent to-[var(--accent-purple)]/[0.04] pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative">
                <HeroGlowAvatar user={user} t={t} isSpecial={user.role !== 'USER'} />

                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                      {user.displayName || user.username}
                    </h1>
                    {roleLabel && (
                      <motion.span
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                      >
                        <Badge className={`${roleBadgeStyle} border flex items-center gap-1.5 px-2.5 py-0.5`}>
                          <Crown className="w-3.5 h-3.5" />
                          {roleLabel}
                        </Badge>
                      </motion.span>
                    )}
                    {user.emailVerified && (
                      <Badge className="bg-[var(--success)]/10 text-[var(--success)] text-xs border border-[var(--success)]/20">
                        {t('userProfile.roles.verified')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-[var(--text-tertiary)] inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t('userProfile.memberSince', { date: memberSince })}</span>
                    </span>
                    {user.clanMemberships?.length > 0 && (
                      <Link
                        href={`/community/clan/${user.clanMemberships[0].clan.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 px-2 py-0.5 rounded-full transition-colors"
                      >
                        {user.clanMemberships[0].clan.emblemUrl ? (
                          <Image
                            src={user.clanMemberships[0].clan.emblemUrl}
                            alt={`Emblema de ${user.clanMemberships[0].clan.name}`}
                            width={12}
                            height={12}
                            className="w-3 h-3 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-3 h-3" />
                        )}
                        <span>{user.clanMemberships[0].clan.name}</span>
                      </Link>
                    )}
                  </div>

                  <p className="text-sm text-[var(--text-secondary)]">@{user.username}</p>

                  {/* XP Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Flame className="w-5 h-5 text-[var(--warning)]" />
                        </motion.span>
                        <span className="font-bold text-[var(--text-primary)]">{t('userProfile.levelAndXp', { level: user.level, xp: user.xpPoints })}</span>
                      </div>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {user.xpPoints.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, var(--primary), var(--accent-purple), var(--warning))',
                          backgroundSize: '200% 100%',
                        }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${xpProgress}%`,
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          width: { duration: 1, ease: [0.4, 0, 0.2, 1] },
                          backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {!isOwnProfile && sessionUserId && (
                    <FollowButton targetId={user.id} targetType="USER" size="default" />
                  )}
                  {isOwnProfile && (
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        {t('userProfile.buttons.editProfile')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ═══════ Stats Grid ═══════ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} index={i} onClick={stat.onClick} />
            ))}
          </div>

          {/* ═══════ Bio & Social ═══════ */}
          {(user.bio || user.website || user.socialLinks) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            >
              <Card className="p-6 mb-8 relative overflow-hidden border-[var(--border)]/80 bg-[var(--surface)]/70 backdrop-blur-md">
                {user.bio && (
                  <p className="text-[var(--text-primary)] leading-relaxed text-sm mb-4">{user.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] hover:border-[var(--border-strong)] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                  {user.socialLinks && (() => {
                    try {
                      const links = JSON.parse(user.socialLinks);
                      return Object.entries(links).map(([platform, url]) => {
                        if (!url) return null;
                        const config = socialConfig[platform];
                        if (!config) return null;
                        return (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={config.label}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--text-secondary)] ${config.brandColor} transition-all duration-200 hover:scale-110 hover:border-[var(--border-strong)]`}
                          >
                            {config.icon}
                          </a>
                        );
                      });
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ═══════ Tabs ═══════ */}
          <Tabs defaultValue="activity">
            <TabsList className="mb-6">
              <TabsTrigger
                value="activity"
                className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--text-inverse)] data-[state=active]:shadow-md transition-all duration-200"
              >
                <Activity className="w-4 h-4" />
                {t('userProfile.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger
                value="reading"
                className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--text-inverse)] data-[state=active]:shadow-md transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" />
                {t('userProfile.tabs.reading')}
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--text-inverse)] data-[state=active]:shadow-md transition-all duration-200"
              >
                <Trophy className="w-4 h-4" />
                {t('userProfile.tabs.achievements')}
                {user.achievements.length > 0 && (
                  <span className="ml-1 bg-[var(--primary)]/20 text-[var(--primary)] text-xs rounded-full px-1.5 py-0.5">
                    {user._count.achievements}
                  </span>
                )}
              </TabsTrigger>
              {user._count.createdMangas > 0 && (
                <TabsTrigger
                  value="created"
                  className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--text-inverse)] data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Star className="w-4 h-4" />
                  {t('userProfile.tabs.created')}
                </TabsTrigger>
              )}
              {user.collections && user.collections.length > 0 && (
                <TabsTrigger
                  value="collections"
                  className="flex items-center gap-2 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--text-inverse)] data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Bookmark className="w-4 h-4" />
                  {t('userProfile.tabs.collections')}
                  <span className="ml-1 bg-[var(--primary)]/20 text-[var(--primary)] text-xs rounded-full px-1.5 py-0.5">
                    {user.collections!.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* ══ Activity Tab ══ */}
            <TabsContent value="activity" className="border border-[var(--border)]/50 rounded-xl p-5">
              <TimelineActivity activities={user.activitiesFeed} t={t} dateLocale={dateLocale} />
            </TabsContent>

            {/* ══ Reading Tab ══ */}
            <TabsContent value="reading" className="border border-[var(--border)]/50 rounded-xl p-5">
              {user.readingProgress.length > 0 ? (
                <motion.div
                  className="grid gap-3 sm:grid-cols-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {user.readingProgress.map((progress, idx) => (
                    <motion.div
                      key={progress.id}
                      variants={itemVariants}
                      className={idx === 0 ? 'sm:col-span-2' : ''}
                    >
                      <ReadingCard progress={progress} t={t} dateLocale={dateLocale} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <EmptyState
                  title={t('userProfile.empty.reading.title')}
                  description={t('userProfile.empty.reading.description')}
                  icon={<BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />}
                />
              )}
            </TabsContent>

            {/* ══ Achievements Tab ══ */}
            <TabsContent value="achievements" className="border border-[var(--border)]/50 rounded-xl p-5">
              {user.achievements.length > 0 ? (
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {user.achievements.map((ua) => (
                    <AchievementCard key={ua.id} ua={ua} t={t} dateLocale={dateLocale} />
                  ))}
                </motion.div>
              ) : (
                <EmptyState
                  title={t('userProfile.empty.achievements.title')}
                  description={t('userProfile.empty.achievements.description')}
                  icon={<Trophy className="w-12 h-12 text-[var(--text-tertiary)]" />}
                />
              )}
            </TabsContent>

            {/* ══ Collections Tab ══ */}
            {user.collections && user.collections.length > 0 && (
              <TabsContent value="collections" className="border border-[var(--border)]/50 rounded-xl p-5">
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                  {user.collections.map((col: any) => (
                    <motion.div key={col.id} variants={itemVariants}>
                      <Link href={`/collections/${col.id}`}>
                        <Card className="p-4 h-full hover:border-[var(--primary)] transition-all duration-200">
                          <h3 className="font-semibold mb-1 truncate">{col.name}</h3>
                          {col.description && <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2">{col.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{col._count?.items || 0}</span>
                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />{col._count?.likes || 0}</span>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            )}

            {/* ══ Created Tab ══ */}
            {user._count.createdMangas > 0 && (
              <TabsContent value="created" className="border border-[var(--border)]/50 rounded-xl p-5">
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {user.createdMangas.map((manga) => (
                    <MangaCreatedCard key={manga.id} manga={manga} isOwnProfile={isOwnProfile} t={t} />
                  ))}
                  {isOwnProfile && (
                    <motion.div variants={itemVariants}>
                      <Link href="/creator/dashboard">
                        <Card className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 border-dashed hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)]/10 transition-all duration-200 cursor-pointer">
                          <Plus className="w-8 h-8 text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-tertiary)]">{t('userProfile.buttons.createAnother')}</span>
                        </Card>
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <FollowersModal
        open={followModalOpen}
        onOpenChange={setFollowModalOpen}
        following={following}
        followers={followers}
      />
      <LibraryModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
        entries={libraryEntries}
      />
      <CollectionsModal
        open={collectionsModalOpen}
        onOpenChange={setCollectionsModalOpen}
        collections={(user.collections || []).map((c) => ({
          id: c.id,
          title: c.name,
          coverUrl: null,
          description: c.description || null,
          _count: { items: c._count.items },
        }))}
      />
      <AchievementsModal
        open={achievementsModalOpen}
        onOpenChange={setAchievementsModalOpen}
        achievements={user.achievements as any}
      />
    </div>
  );
}
