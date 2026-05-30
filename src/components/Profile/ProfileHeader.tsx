'use client';

import type { Locale } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, Crown, Flame, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { ProfileCover } from './ProfileCover';
import { ProfileSocialLinks } from './ProfileSocialLinks';
import { ProfileStatsRow } from './ProfileStatsRow';
import { Avatar, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface StatItem {
  value: number;
  label: string;
  onClick?: () => void;
}

interface ProfileHeaderProps {
  user: {
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
    readingStreak?: number;
    createdAt: Date | string;
    clanMemberships?: Array<{ clan: { id: string; name: string; slug: string; emblemUrl: string | null } }>;
    emailVerified?: Date | string | null;
  };
  stats: StatItem[];
  xpProgress: number;
  xpForNextLevel: number;
  t: (key: string, params?: Record<string, string | number>) => string;
  dateLocale: Intl.Locale | Locale;
  memberSince: string;
  actions: React.ReactNode;
  followsYou?: boolean;
  coverUrl?: string | null;
}

export function ProfileHeader({
  user,
  stats,
  xpProgress,
  xpForNextLevel,
  t,
  dateLocale: _dateLocale,
  memberSince,
  actions,
  followsYou,
  coverUrl,
}: ProfileHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const roleLabel =
    user.role === 'ADMIN' ? t('userProfile.roles.admin') : user.role === 'MODERATOR' ? t('userProfile.roles.moderator') : null;

  const roleBadgeStyle =
    user.role === 'ADMIN'
      ? 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20'
      : 'bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="overflow-hidden border-[var(--border)]/80 bg-[var(--surface)]/70 backdrop-blur-md">
        <ProfileCover coverUrl={coverUrl} />

        <div className="px-6 pb-6 relative">
          {/* Avatar — positioned to overlap cover */}
          <motion.div
            className="-mt-16 sm:-mt-20 relative z-10 mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="relative inline-block">
              {user.role !== 'USER' && !shouldReduceMotion && (
                <motion.div
                  className="absolute -inset-1 rounded-full opacity-60"
                  style={{
                    background: user.role === 'ADMIN'
                      ? 'linear-gradient(135deg, var(--error), var(--warning))'
                      : 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                  }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-[var(--surface)] shadow-xl">
                <AvatarImage src={user.avatarUrl || undefined} />
              </Avatar>
              {user.role !== 'USER' && (
                <motion.span
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 dark:bg-yellow-500 text-gray-900 flex items-center justify-center text-[10px] ring-2 ring-[var(--surface)] z-20 shadow-lg"
                  animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  role="img"
                  aria-label={roleLabel || ''}
                >
                  <Crown className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Name + Badges */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] truncate">
                  {user.displayName || user.username}
                </h1>
                {roleLabel && (
                  <Badge className={`${roleBadgeStyle} border flex items-center gap-1 px-2 py-0.5`}>
                    <Crown className="w-3 h-3" />
                    {roleLabel}
                  </Badge>
                )}
                {user.emailVerified && (
                  <Badge className="bg-[var(--success)]/10 text-[var(--success)] text-xs border border-[var(--success)]/20">
                    {t('userProfile.roles.verified')}
                  </Badge>
                )}
                {followsYou && (
                  <Badge variant="secondary" className="text-xs">
                    {t('userProfile.followsYou')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">@{user.username}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">{actions}</div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3 max-w-2xl">
              {user.bio}
            </p>
          )}

          {/* Website + Social + Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
            <ProfileSocialLinks website={user.website} socialLinks={user.socialLinks} />
            <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {memberSince}
            </span>
            {user.clanMemberships && user.clanMemberships.length > 0 && (
              <Link
                href={`/community/clan/${user.clanMemberships[0].clan.slug}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 px-2 py-0.5 rounded-full transition-colors"
              >
                {user.clanMemberships[0].clan.emblemUrl ? (
                  <Image
                    src={user.clanMemberships[0].clan.emblemUrl}
                    alt={user.clanMemberships[0].clan.name}
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

          {/* Stats Row */}
          <div className="mb-4">
            <ProfileStatsRow stats={stats} />
          </div>

          {/* XP Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <motion.span
                animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame className="w-4 h-4 text-[var(--warning)]" />
              </motion.span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {t('userProfile.levelAndXp', { level: user.level, xp: user.xpPoints })}
              </span>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="relative h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, var(--primary), var(--accent-purple), var(--warning))',
                    backgroundSize: '200% 100%',
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${xpProgress}%`,
                    backgroundPosition: shouldReduceMotion ? '0% 50%' : ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    width: { duration: 1, ease: [0.4, 0, 0.2, 1] },
                    backgroundPosition: shouldReduceMotion ? {} : { duration: 3, repeat: Infinity, ease: 'linear' },
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
              {user.xpPoints.toLocaleString()} / {xpForNextLevel.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
