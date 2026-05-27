'use client';

import {
  BookOpen,
  Trophy,
  Heart,
  Users,
  Settings,
  Crown,
  Flame,
  Star,
  Globe,
  Camera,
  Video,
  Library,
  TrendingUp,
  ChevronRight,
  Award,
  Sparkles,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Avatar, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { FollowersModal } from './FollowersModal';
import { LibraryModal } from './LibraryModal';
import { CollectionsModal } from './CollectionsModal';
import { AchievementsModal } from './AchievementsModal';

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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
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

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 300, damping: 20 },
  }),
};

function CircularProgress({ value, size = 72 }: { value: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-sunken)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(--xp-gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
      />
      <defs>
        <linearGradient id="--xp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  index,
  onClick,
  accent,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
  index: number;
  onClick?: () => void;
  accent: string;
}) {
  return (
    <motion.div
      variants={statVariants}
      custom={index}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button onClick={onClick} className="block w-full text-left cursor-pointer">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-md">
          <div className="flex items-center justify-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <motion.span
                className="text-2xl font-bold text-[var(--text-primary)] block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                {value}
              </motion.span>
              <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

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
            Capítulo {progress.chapter?.chapterNumber || '?'}
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

export default function ProfileClient({ user, xpProgress, xpForNextLevel, following, followers, libraryEntries, collections }: ProfileClientProps) {
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  const roleColors: Record<string, string> = {
    ADMIN: 'from-amber-500 to-rose-500',
    MODERATOR: 'from-[var(--primary)] to-[var(--accent-purple)]',
  };

  const statAccents = [
    'from-blue-500 to-cyan-500',
    'from-rose-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-purple-500',
    'from-amber-500 to-orange-500',
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Profile Header */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />

            <div className="relative p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar with glow */}
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${roleColors[user.role] || 'from-[var(--primary)]/30 to-[var(--accent-purple)]/30'} opacity-60 blur-sm`} />
                  <Avatar className="w-24 h-24 ring-2 ring-[var(--border)]">
                    <AvatarImage src={user.avatarUrl || undefined} />
                  </Avatar>
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                      {user.displayName || user.username}
                    </h1>
                    {user.role !== 'USER' && (
                      <Badge
                        variant={user.role === 'ADMIN' ? 'destructive' : 'ink'}
                      >
                        {user.role === 'ADMIN' ? 'Admin' : 'Moderador'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)]">@{user.username}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>

                  {/* XP Section */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <CircularProgress value={xpProgress} size={64} />
                      <div className="absolute flex flex-col items-center">
                        <Crown className="w-4 h-4 text-[var(--warning)]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">{user.level}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Nivel {user.level}</span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {user.xpPoints} / {xpForNextLevel} XP
                        </span>
                      </div>
                      <Progress value={xpProgress} className="h-2" />
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-[var(--primary)]" />
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {Math.round(xpProgress)}% al siguiente nivel
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/settings">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
        >
          <StatCard
            icon={Library}
            value={user._count?.library ?? 0}
            label="Mangas en biblioteca"
            index={0}
            onClick={() => setLibraryModalOpen(true)}
            accent={statAccents[0]}
          />
          <StatCard
            icon={Heart}
            value={user._count?.following ?? 0}
            label="Siguiendo"
            index={1}
            onClick={() => setFollowModalOpen(true)}
            accent={statAccents[1]}
          />
          <StatCard
            icon={Users}
            value={user._count?.followers ?? 0}
            label="Seguidores"
            index={2}
            onClick={() => setFollowModalOpen(true)}
            accent={statAccents[2]}
          />
          <StatCard
            icon={Star}
            value={user._count?.collections ?? 0}
            label="Colecciones"
            index={3}
            onClick={() => setCollectionsModalOpen(true)}
            accent={statAccents[3]}
          />
          <StatCard
            icon={Award}
            value={user._count?.achievements ?? 0}
            label="Logros"
            index={4}
            onClick={() => setAchievementsModalOpen(true)}
            accent={statAccents[4]}
          />
        </motion.div>

        {/* Bio & Social */}
        {(user.bio || user.website || user.socialLinks) && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

            {user.bio && (
              <p className="text-[var(--text-primary)] leading-relaxed text-sm mb-4">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* Website */}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] hover:border-[var(--border-strong)] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}

              {/* Social Links */}
              {user.socialLinks && (() => {
                try {
                  const links = JSON.parse(user.socialLinks);
                  const hasLinks = Object.values(links).some(Boolean);
                  if (!hasLinks) return null;

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
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-secondary)] ${config.brandColor} transition-all duration-200 hover:scale-110 hover:border-[var(--border-strong)]`}
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

        {/* Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="reading" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="reading">
                <BookOpen className="w-4 h-4 mr-2" />
                Lectura
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Trophy className="w-4 h-4 mr-2" />
                Logros
              </TabsTrigger>
              <TabsTrigger value="collections">
                <Star className="w-4 h-4 mr-2" />
                Colecciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reading">
              <Card className="p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[var(--warning)]" />
                  Continuar leyendo
                </h2>

                {user.readingProgress.length === 0 ? (
                  <EmptyState
                    title="Sin actividad reciente"
                    description="Comienza a leer mangas para ver tu progreso aquí"
                    action={{ label: 'Explorar mangas', href: '/explore' }}
                  />
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 },
                      },
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
                    Ver historial completo
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card className="p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[var(--warning)]" />
                  Logros recientes
                </h2>

                {user.achievements.length === 0 ? (
                  <EmptyState
                    title="Sin logros aún"
                    description="Completa acciones para desbloquear logros"
                    action={{ label: 'Ver todos los logros', href: '/achievements' }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {user.achievements.slice(0, 3).map((ua) => (
                      <AchievementCard key={ua.id} achievement={ua} />
                    ))}
                  </div>
                )}

                <Link href="/achievements">
                  <Button variant="outline" className="w-full mt-4 group">
                    Ver todos los logros
                    <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </Card>
            </TabsContent>

            <TabsContent value="collections">
              <Card className="p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Star className="w-5 h-5 text-[var(--primary)]" />
                    Mis colecciones
                  </h2>
                  <Link href="/collections/create">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button size="sm">Crear colección</Button>
                    </motion.div>
                  </Link>
                </div>

                {collections.length === 0 ? (
                  <EmptyState
                    title="Sin colecciones"
                    description="Organiza tus mangas favoritos en colecciones"
                    action={{ label: 'Crear colección', href: '/collections/create' }}
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
                          {col._count.items} mangas
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {collections.length > 0 && (
                  <Link href="/collections">
                    <Button variant="outline" className="w-full mt-4">
                      Ver todas las colecciones
                    </Button>
                  </Link>
                )}
              </Card>
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
