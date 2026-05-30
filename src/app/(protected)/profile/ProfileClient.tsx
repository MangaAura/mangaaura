'use client';

import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Settings,
  Flame,
  Star,
  ChevronRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AchievementsModal } from './AchievementsModal';
import { CollectionsModal } from './CollectionsModal';
import { FollowersModal } from './FollowersModal';
import { LibraryModal } from './LibraryModal';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { ProfileHeader, ProfileTimeline, ProfileCompletionMeter } from '@/components/Profile';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useT, useLocale } from '@/i18n';

interface ReadingProgress {
  id: string;
  percentage: number;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  chapter: {
    chapterNumber: number;
  } | null;
}

interface UserAchievement {
  id: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    iconUrl: string | null;
    category: string;
    difficulty: string;
  };
  unlockedAt: Date;
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
  level: number;
  xpPoints: number;
  _count: {
    library: number;
    collections: number;
    following: number;
    followers: number;
    achievements: number;
  } | null;
  achievements: UserAchievement[];
  readingProgress: ReadingProgress[];
  clanMemberships?: Array<{ clan: { id: string; name: string; slug: string; emblemUrl: string | null } }>;
  createdAt: Date | string;
}

interface FollowItem {
  id: string;
  following: {
    id: string;
    username: string;
    displayName: string | null;
    level: number;
    avatarUrl: string | null;
  };
  follower: {
    id: string;
    username: string;
    displayName: string | null;
    level: number;
    avatarUrl: string | null;
  };
}

interface LibraryEntry {
  id: string;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  status: string;
}

interface CollectionEntry {
  id: string;
  title: string;
  coverUrl: string | null;
  description: string | null;
  _count: {
    items: number;
  };
}

interface ProfileClientProps {
  user: UserData;
  xpProgress: number;
  xpForNextLevel: number;
  following: FollowItem[];
  followers: FollowItem[];
  libraryEntries: LibraryEntry[];
  collections: CollectionEntry[];
  activities?: Array<{ id: string; activityType: string; metadata: string | null; createdAt: Date | string }>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

function AchievementCard({ achievement }: { achievement: UserAchievement }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-xl border border-[var(--warning)]/20 bg-gradient-to-br from-[var(--warning)]/5 to-transparent p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--warning)]/30 to-[var(--warning)]/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[var(--warning)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate">
            {achievement.achievement.name}
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] truncate">
            {achievement.achievement.description}
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
      </div>
    </motion.div>
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
    <Card className="p-6" aria-label="Loading activity">
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
    </Card>
  );
}

function ReadingTabSkeleton() {
  return (
    <Card className="p-6" aria-label="Loading reading progress">
      <SkeletonBar className="h-6 w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <SkeletonBar className="w-14 h-20 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/3" />
              <SkeletonBar className="h-3 w-1/3" />
              <SkeletonBar className="h-2 w-full mt-3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AchievementTabSkeleton() {
  return (
    <Card className="p-6" aria-label="Loading achievements">
      <SkeletonBar className="h-6 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)]/50 p-4">
            <div className="flex items-center gap-3">
              <SkeletonBar className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-4 w-4/5" />
                <SkeletonBar className="h-3 w-3/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CollectionsTabSkeleton() {
  return (
    <Card className="p-6" aria-label="Loading collections">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBar className="h-6 w-36" />
        <SkeletonBar className="h-9 w-32 rounded-lg" />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <SkeletonBar className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBar className="h-4 w-2/5" />
              <SkeletonBar className="h-3 w-1/4" />
            </div>
            <SkeletonBar className="h-3 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReadingCard({ progress }: { progress: ReadingProgress }) {
  return (
    <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Link
        href={`/manga/${progress.manga.slug}/chapter/${progress.chapter?.chapterNumber || 1}`}
        className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors group"
      >
        <div className="w-14 h-20 rounded-lg bg-[var(--surface-sunken)] overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]">
          {progress.manga.coverUrl ? (
            <OptimizedImage
              src={progress.manga.coverUrl}
              alt={progress.manga.title}
              fill
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold">
              {progress.manga.title[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
            {progress.manga.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {progress.chapter ? `Capítulo ${progress.chapter.chapterNumber}` : 'Comenzando'}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <Progress value={progress.percentage} className="h-1.5" />
            </div>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              {Math.round(progress.percentage)}%
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
      </Link>
    </motion.div>
  );
}

export default function ProfileClient({ user, xpProgress, xpForNextLevel, following, followers, libraryEntries, collections, activities }: ProfileClientProps) {
  const t = useT();
  const { locale } = useLocale();
  const dateLocale = locale === 'es' ? es : enUS;
  const [ready, setReady] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  const memberSince = format(new Date(user.createdAt), "MMMM 'de' yyyy", { locale: dateLocale });

  const stats = [
    { value: user._count?.library ?? 0, label: t('userProfile.stats.mangas'), onClick: () => setLibraryModalOpen(true) },
    { value: user._count?.following ?? 0, label: t('userProfile.stats.following'), onClick: () => setFollowModalOpen(true) },
    { value: user._count?.followers ?? 0, label: t('userProfile.stats.followers'), onClick: () => setFollowModalOpen(true) },
    { value: user._count?.achievements ?? 0, label: t('userProfile.stats.achievements'), onClick: () => setAchievementsModalOpen(true) },
    { value: user._count?.collections ?? 0, label: t('userProfile.stats.collections') || 'Colecciones', onClick: () => setCollectionsModalOpen(true) },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-8"
    >
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
          actions={
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1.5" />
                {t('userProfile.buttons.editProfile')}
              </Button>
            </Link>
          }
        />

        <ProfileCompletionMeter
          hasAvatar={!!user.avatarUrl}
          hasCover={!!user.coverUrl}
          hasBio={!!user.bio}
          hasWebsite={!!user.website}
          hasSocialLinks={!!user.socialLinks}
          t={t}
        />

        {/* Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="w-full sm:w-auto overflow-x-auto max-w-full">
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                {t('userProfile.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="reading">
                <BookOpen className="w-4 h-4 mr-2" />
                {t('userProfile.tabs.reading')}
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Trophy className="w-4 h-4 mr-2" />
                {t('userProfile.tabs.achievements')}
              </TabsTrigger>
              <TabsTrigger value="collections">
                <Star className="w-4 h-4 mr-2" />
                {t('userProfile.tabs.collections')}
              </TabsTrigger>
            </TabsList>

            {/* Activity Tab — Timeline style */}
            <TabsContent value="activity">
              {!ready ? (
                <ActivityTabSkeleton />
              ) : (
                <Card className="p-6">
                  <ProfileTimeline
                    activities={(activities || []) as any}
                    t={t}
                    dateLocale={dateLocale}
                  />
                </Card>
              )}
            </TabsContent>

            {/* Reading Tab */}
            <TabsContent value="reading">
              {!ready ? (
                <ReadingTabSkeleton />
              ) : (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[var(--warning)]" />
                    {t('userProfile.tabs.reading')}
                  </h2>

                  {user.readingProgress.length === 0 ? (
                    <EmptyState
                      title={t('userProfile.empty.reading.title')}
                      description={t('userProfile.empty.reading.description')}
                      action={{ label: t('userProfile.buttons.exploreMangas') || 'Explorar mangas', href: '/explore' }}
                      icon={<BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />}
                    />
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
                      }}
                      className="space-y-1"
                    >
                      {user.readingProgress.slice(0, 5).map((progress) => (
                        <motion.div
                          key={progress.id}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 },
                          }}
                        >
                          <ReadingCard progress={progress} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[var(--border)] text-center">
                    <Link
                      href="/reading-history"
                      className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline font-semibold group"
                    >
                      {t('userProfile.buttons.viewHistory') || 'Ver historial completo'}
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              {!ready ? (
                <AchievementTabSkeleton />
              ) : (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[var(--warning)]" />
                    {t('userProfile.tabs.achievements')}
                  </h2>

                  {user.achievements.length === 0 ? (
                    <EmptyState
                      title={t('userProfile.empty.achievements.title')}
                      description={t('userProfile.empty.achievements.description')}
                      action={{ label: t('userProfile.buttons.viewAllAchievements') || 'Ver todos', href: '/achievements' }}
                      icon={<Trophy className="w-12 h-12 text-[var(--text-tertiary)]" />}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {user.achievements.slice(0, 3).map((ua) => (
                        <AchievementCard key={ua.id} achievement={ua} />
                      ))}
                    </div>
                  )}

                  <Link href="/achievements">
                    <Button variant="outline" className="w-full mt-4 group">
                      {t('userProfile.buttons.viewAllAchievements') || 'Ver todos los logros'}
                      <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </Card>
              )}
            </TabsContent>

            {/* Collections Tab */}
            <TabsContent value="collections">
              {!ready ? (
                <CollectionsTabSkeleton />
              ) : (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Star className="w-5 h-5 text-[var(--primary)]" />
                      {t('userProfile.tabs.collections')}
                    </h2>
                    <Link href="/collections/create">
                      <Button size="sm">{t('userProfile.buttons.createCollection') || 'Crear colección'}</Button>
                    </Link>
                  </div>

                  {collections.length === 0 ? (
                    <EmptyState
                      title={t('userProfile.empty.collections.title') || 'Sin colecciones'}
                      description={t('userProfile.empty.collections.description') || 'Organiza tus mangas favoritos en colecciones'}
                      action={{ label: t('userProfile.buttons.createCollection') || 'Crear colección', href: '/collections/create' }}
                      icon={<Star className="w-12 h-12 text-[var(--text-tertiary)]" />}
                    />
                  ) : (
                    <div className="divide-y divide-[var(--border)] -mx-6 px-6">
                      {collections.map((col) => (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                              {col.title}
                            </p>
                            {col.description && (
                              <p className="text-xs text-[var(--text-tertiary)] truncate">{col.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
                            {col._count.items} {t('userProfile.caps')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {collections.length > 0 && (
                    <Link href="/collections">
                      <Button variant="outline" className="w-full mt-4">
                        {t('userProfile.buttons.viewAllCollections') || 'Ver todas las colecciones'}
                      </Button>
                    </Link>
                  )}
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
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
        collections={collections}
      />
      <AchievementsModal
        open={achievementsModalOpen}
        onOpenChange={setAchievementsModalOpen}
        achievements={user.achievements}
      />
    </motion.div>
  );
}
