'use client';

import {
  BookOpen,
  Trophy,
  Heart,
  Settings,
  Crown,
  Flame,
  Star,
  Globe,
  Camera,
  Video,
  MessageCircle,
  Library,
  TrendingUp,
  ChevronRight,
  Award,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Avatar, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

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
    achievements: number;
  } | null;
  achievements: UserAchievement[];
  readingProgress: ReadingProgress[];
}

interface ProfileClientProps {
  user: UserData;
  xpProgress: number;
  xpForNextLevel: number;
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
  href,
  accent,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
  index: number;
  href: string;
  accent: string;
}) {
  return (
    <motion.div
      variants={statVariants}
      custom={index}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href} className="block">
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
      </Link>
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

export default function ProfileClient({ user, xpProgress, xpForNextLevel }: ProfileClientProps) {
  const roleColors: Record<string, string> = {
    ADMIN: 'from-amber-500 to-rose-500',
    MODERATOR: 'from-[var(--primary)] to-[var(--accent-purple)]',
  };

  const statAccents = [
    'from-blue-500 to-cyan-500',
    'from-rose-500 to-pink-500',
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
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <StatCard
            icon={Library}
            value={user._count?.library ?? 0}
            label="Mangas en biblioteca"
            index={0}
            href="/library"
            accent={statAccents[0]}
          />
          <StatCard
            icon={Heart}
            value={user._count?.following ?? 0}
            label="Siguiendo"
            index={1}
            href="/following"
            accent={statAccents[1]}
          />
          <StatCard
            icon={Star}
            value={user._count?.collections ?? 0}
            label="Colecciones"
            index={2}
            href="/collections"
            accent={statAccents[2]}
          />
          <StatCard
            icon={Award}
            value={user._count?.achievements ?? 0}
            label="Logros"
            index={3}
            href="/achievements"
            accent={statAccents[3]}
          />
        </motion.div>

        {/* Bio & Social */}
        {(user.bio || user.website || user.socialLinks) && (
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
              <div className="space-y-4">
                {user.bio && (
                  <p className="text-[var(--text-primary)] leading-relaxed">{user.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] hover:border-[var(--border-strong)] transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {user.socialLinks && (() => {
                    try {
                      const links = JSON.parse(user.socialLinks);
                      const hasLinks = Object.values(links).some(Boolean);
                      if (!hasLinks) return null;
                      const socialIcons: Record<string, typeof Globe> = {
                        twitter: MessageCircle,
                        instagram: Camera,
                        youtube: Video,
                        tiktok: MessageCircle,
                        discord: MessageCircle,
                      };
                      return Object.entries(links).map(([platform, url]) => {
                        if (!url) return null;
                        const Icon = socialIcons[platform] || Globe;
                        return (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        );
                      });
                    } catch {
                      return null;
                    }
                  })()}
                </div>
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

                <EmptyState
                  title="Sin colecciones"
                  description="Organiza tus mangas favoritos en colecciones"
                  action={{ label: 'Crear colección', href: '/collections/create' }}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

      </div>
    </motion.div>
  );
}
