'use client';

import { formatDistanceToNow, format } from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { motion, type Variants } from 'framer-motion';
import {
  Flame,
  BookOpen,
  Trophy,
  Star,
  Activity,
  Clock,
  Plus,
  Sparkles,
  Eye,
  Bookmark,
  Share2,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AchievementsModal } from '@/app/(protected)/profile/AchievementsModal';
import { CollectionsModal } from '@/app/(protected)/profile/CollectionsModal';
import { FollowersModal } from '@/app/(protected)/profile/FollowersModal';
import { LibraryModal } from '@/app/(protected)/profile/LibraryModal';
import { ProfileHeader, ProfileTimeline } from '@/components/Profile';
import { FollowButton } from '@/components/Social/FollowButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useT, useLocale } from '@/i18n';

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

interface FollowUserSummary {
  id: string;
  username: string;
  displayName: string | null;
  level: number;
  avatarUrl: string | null;
}

interface UserData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
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
  clanMemberships: { clan: { id: string; name: string; slug: string; emblemUrl: string | null } }[];
  collections?: Array<{ id: string; name: string; description?: string | null; _count: { items: number; likes: number } }>;
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
  isFollowingUser?: boolean;
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

// ─── Sub-components ────────────────────────────────────────────────────────────────

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

// ─── Skeleton States ─────────────────────────────────────────────────

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--border)]/60 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

function ActivityTabSkeleton() {
  return (
    <div className="border border-[var(--border)]/50 rounded-xl p-5" aria-label="Loading activity">
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBar className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-3/5" />
              <SkeletonBar className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingTabSkeleton() {
  return (
    <div className="border border-[var(--border)]/50 rounded-xl p-5" aria-label="Loading reading">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-4 p-4 rounded-xl border border-[var(--border)]/50 ${i === 0 ? 'sm:col-span-2' : ''}`}>
            <SkeletonBar className="w-14 h-[72px] rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/3" />
              <SkeletonBar className="h-3 w-1/3" />
              <div className="flex items-center justify-between mt-2">
                <SkeletonBar className="w-9 h-9 rounded-full" />
                <SkeletonBar className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementTabSkeleton() {
  return (
    <div className="border border-[var(--border)]/50 rounded-xl p-5" aria-label="Loading achievements">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 text-center rounded-xl border border-[var(--border)]/50">
            <SkeletonBar className="w-14 h-14 mx-auto mb-3 rounded-xl" />
            <SkeletonBar className="h-4 w-3/4 mx-auto mb-2" />
            <SkeletonBar className="h-3 w-5/6 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatedTabSkeleton() {
  return (
    <div className="border border-[var(--border)]/50 rounded-xl p-5" aria-label="Loading mangas">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[var(--border)]/50">
            <SkeletonBar className="aspect-[3/4] w-full" />
            <div className="p-3 space-y-2">
              <SkeletonBar className="h-4 w-4/5" />
              <SkeletonBar className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsTabSkeleton() {
  return (
    <div className="border border-[var(--border)]/50 rounded-xl p-5" aria-label="Loading collections">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-[var(--border)]/50">
            <SkeletonBar className="h-5 w-3/5 mb-2" />
            <SkeletonBar className="h-3 w-4/5 mb-3" />
            <div className="flex gap-3">
              <SkeletonBar className="h-3 w-12" />
              <SkeletonBar className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────────

export function UserProfileClient({ user, isOwnProfile, sessionUserId, following, followers, libraryEntries, isFollowingUser }: UserProfileClientProps) {
  const t = useT();
  const { locale } = useLocale();
  const dateLocale = locale === 'es' ? es : enUS;
  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min(100, (user.xpPoints / xpForNextLevel) * 100);

  const [ready, setReady] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const unreadCount = useUnreadMessages();
  const router = useRouter();

  useEffect(() => { if (!ready) queueMicrotask(() => setReady(true)); }, []);

  const memberSince = format(new Date(user.createdAt), "MMMM 'de' yyyy", { locale: dateLocale });

  const stats = [
    { value: user._count.library, label: t('userProfile.stats.mangas'), onClick: () => setLibraryModalOpen(true) },
    { value: user._count.following, label: t('userProfile.stats.following'), onClick: () => setFollowModalOpen(true) },
    { value: user._count.followers, label: t('userProfile.stats.followers'), onClick: () => setFollowModalOpen(true) },
    { value: user._count.achievements, label: t('userProfile.stats.achievements'), onClick: () => setAchievementsModalOpen(true) },
    { value: user._count.collections, label: t('userProfile.stats.collections') || 'Colecciones', onClick: () => setCollectionsModalOpen(true) },
  ];

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/user/${user.username}`;
    // Use Web Share API on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ url, title: user.displayName || user.username });
        return;
      } catch { /* user cancelled or error */ }
    }
    // Fallback: clipboard with legacy support
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* noop */ }
    }
    setShareTooltip(true);
    setTimeout(() => setShareTooltip(false), 2000);
  };

  return (
    <div className="relative">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <ProfileHeader
            user={user}
            stats={stats}
            coverUrl={user.coverUrl}
            xpProgress={xpProgress}
            xpForNextLevel={xpForNextLevel}
            t={t}
            dateLocale={dateLocale}
            memberSince={memberSince}
            followsYou={!isOwnProfile && isFollowingUser ? true : undefined}
            actions={
              <>
                {!isOwnProfile && sessionUserId && (
                  <>
                    <div className="relative">
                      <button
                        onClick={async () => {
                          if (sendingMessage) return;
                          setSendingMessage(true);
                          try {
                            const res = await fetch('/api/conversations', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id }),
                            });
                            if (!res.ok) throw new Error('Failed to create conversation');
                            const data = await res.json();
                            router.push(`/messages/${data.id}`);
                          } catch {
                            setSendingMessage(false);
                          }
                        }}
                        disabled={sendingMessage}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--primary)] text-[var(--text-inverse)] hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                        aria-label={t('userProfile.buttons.sendMessage')}
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                        {sendingMessage ? '' : t('userProfile.buttons.sendMessage')}
                      </button>
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-md ring-2 ring-[var(--background)]"
                          title={`${unreadCount} mensajes sin leer`}
                          role="status"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                      )}
                    </div>
                    <FollowButton targetId={user.id} targetType="USER" size="default" initialIsFollowing={isFollowingUser} />
                  </>
                )}
                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      {t('userProfile.buttons.editProfile')}
                    </Button>
                  </Link>
                )}
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={handleShareProfile} title={t('userProfile.shareProfile') || 'Compartir perfil'}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {shareTooltip && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-[var(--primary)] text-[var(--text-inverse)] px-2 py-1 rounded whitespace-nowrap"
                    >
                      {t('userProfile.copiedLink') || 'Link copiado'}
                    </motion.span>
                  )}
                </div>
              </>
            }
          />

          {/* ═══════ Tabs ═══════ */}
          <Tabs defaultValue="activity">
            <TabsList className="mb-6 overflow-x-auto max-w-full">
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

            {/* ══ Activity Tab — Timeline Style ══ */}
            <TabsContent value="activity" className="border border-[var(--border)]/50 rounded-xl p-5">
              {!ready ? <ActivityTabSkeleton /> : <ProfileTimeline activities={user.activitiesFeed} t={t} dateLocale={dateLocale} />}
            </TabsContent>

            {/* ══ Reading Tab ══ */}
            <TabsContent value="reading" className="border border-[var(--border)]/50 rounded-xl p-5">
              {!ready ? <ReadingTabSkeleton /> : user.readingProgress.length > 0 ? (
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
              {!ready ? <AchievementTabSkeleton /> : user.achievements.length > 0 ? (
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
                {!ready ? <CollectionsTabSkeleton /> : (
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
                )}
              </TabsContent>
            )}

            {/* ══ Created Tab ══ */}
            {user._count.createdMangas > 0 && (
              <TabsContent value="created" className="border border-[var(--border)]/50 rounded-xl p-5">
                {!ready ? <CreatedTabSkeleton /> : (
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
                )}
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
