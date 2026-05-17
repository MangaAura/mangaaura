'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useT } from '@/i18n';
import {
  Users, Crown, Shield, Trophy, BookOpen, Flame,
  Plus, Calendar, Swords, Loader2, AlertTriangle,
  Zap, TrendingUp, Hash,
} from 'lucide-react';

import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { OptimizedImage } from '@/components/Image/OptimizedImage';

// ── Types ──────────────────────────────────────────────
interface ClanMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  contributedScore: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    xpPoints: number;
    level: number;
  };
}

interface ClanData {
  id: string;
  name: string;
  description: string | null;
  emblemUrl: string | null;
  totalScore: number;
  monthlyScore: number;
  currentSeason: number;
  leaderId: string | null;
  createdAt: string;
  members: ClanMember[];
  memberCount: number;
}

// ── Helpers ────────────────────────────────────────────
function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(member: ClanMember): string {
  return member.user.displayName || member.user.username;
}

function getRoleConfig(role: string) {
  switch (role) {
    case 'LEADER':
      return {
        labelKey: 'clanDetail.leader',
        icon: Crown,
        bg: 'bg-amber-500/15 dark:bg-yellow-500/15',
        text: 'text-amber-700 dark:text-yellow-500',
        border: 'border-amber-500/30',
      };
    case 'OFFICER':
      return {
        labelKey: 'clanDetail.officer',
        icon: Shield,
        bg: 'bg-[var(--accent-purple)]/15',
        text: 'text-[var(--accent-purple)]',
        border: 'border-[var(--accent-purple)]/30',
      };
    default:
      return {
        labelKey: 'clanDetail.member',
        icon: Users,
        bg: 'bg-[var(--text-muted)]/10',
        text: 'text-[var(--text-secondary)]',
        border: 'border-[var(--border)]',
      };
  }
}

function getMemberGradient(index: number): string {
  const gradients = [
    'from-amber-500 to-orange-500',
    'from-violet-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-indigo-500 to-blue-500',
  ];
  return gradients[index % gradients.length];
}

function getPositionStyle(position: number) {
  if (position === 1) return 'text-amber-500 dark:text-yellow-400';
  if (position === 2) return 'text-slate-400 dark:text-slate-300';
  if (position === 3) return 'text-amber-700 dark:text-amber-600';
  return 'text-[var(--text-muted)]';
}

// ── Animation Variants ─────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.25 + i * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

// ── Sub-components ─────────────────────────────────────

function HeroEmblem({ clan }: { clan: ClanData }) {
  const shouldReduceMotion = useReducedMotion();
  const t = useT();
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative"
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-[var(--accent-purple)]/30 blur-xl"
        animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      {/* Emblem container */}
      <div
        className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--primary)] flex items-center justify-center text-6xl shadow-2xl ring-4 ring-[var(--surface)] overflow-hidden"
      >
        {clan.emblemUrl ? (
          <OptimizedImage
            src={clan.emblemUrl}
            alt={`${t('clanDetail.emblemOf')} ${clan.name}`}
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <span role="img" aria-label="Corona">👑</span>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  colorClass,
  index,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
  subtitle?: string;
  colorClass: string;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      custom={index}
      variants={shouldReduceMotion ? {} : statCardVariants}
      initial="hidden"
      animate="visible"
      className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:border-[var(--primary)]/30 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">{value}</p>
          {subtitle && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SeasonProgress({ clan }: { clan: ClanData }) {
  const t = useT();
  const seasonGoal = 100000;
  const progress = Math.min((clan.monthlyScore / seasonGoal) * 100, 100);
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatedContainer animation="fadeInUp" delay={0.3}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[var(--text-primary)]">
            <Flame className="text-red-500" size={22} />
            {t('clanDetail.season')} {clan.currentSeason}
          </h2>
          <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface-sunken)] px-3 py-1 rounded-full">
            {t('clanDetail.goal')}: {seasonGoal.toLocaleString()} {t('clanDetail.pts')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[var(--text-secondary)]">{t('clanDetail.monthlyProgress')}</span>
            <span className="text-lg font-extrabold text-[var(--primary)]">
              {clan.monthlyScore.toLocaleString()}
            </span>
          </div>
          <div className="relative h-4 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] rounded-full"
              initial={shouldReduceMotion ? {} : { width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
            {/* Shine effect */}
            {progress > 0 && (
            <motion.div
              className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={shouldReduceMotion ? {} : { left: ['-10%', '110%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
              aria-hidden="true"
            />
            )}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{Math.round(progress)}% {t('clanDetail.completed')}</span>
            <span>{t('clanDetail.remaining')} {(seasonGoal - clan.monthlyScore).toLocaleString()} {t('clanDetail.pts')}</span>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}

function TotalScoreCard({ clan }: { clan: ClanData }) {
  const t = useT();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatedContainer animation="fadeInUp" delay={0.4}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--warning)]/10 to-transparent rounded-bl-full" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--warning)]/15 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <h2 className="font-bold text-lg text-[var(--text-primary)]">{t('clanDetail.totalScore')}</h2>
          </div>

          <motion.p
            className="text-4xl font-extrabold text-[var(--warning)]"
            initial={shouldReduceMotion ? {} : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {clan.totalScore.toLocaleString()}
          </motion.p>

          <div className="flex items-center gap-3 mt-3 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <TrendingUp size={14} className="text-emerald-500" />
              {t('clanDetail.globalRanking')}
            </span>
            <span className="flex items-center gap-1">
              <Swords size={14} className="text-[var(--accent-purple)]" />
              {clan.memberCount} {t('clanDetail.warriors')}
            </span>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
}

function MemberRow({
  member,
  position,
}: {
  member: ClanMember;
  position: number;
}) {
  const t = useT();
  const roleConfig = getRoleConfig(member.role);
  const RoleIcon = roleConfig.icon;
  const displayName = getDisplayName(member);
  const positionStyle = getPositionStyle(position);
  const shouldReduceMotion = useReducedMotion();

  return (
    <Link
      href={`/user/${member.user.username}`}
      className="block group"
    >
      <motion.div
        variants={shouldReduceMotion ? {} : itemVariants}
        className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-sunken)]/50 transition-colors cursor-pointer"
      >
      {/* Position */}
      <div className={`w-8 text-center font-black text-lg flex-shrink-0 ${positionStyle}`}>
        {position <= 3 ? (
          <span className="text-xl">
            {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
          </span>
        ) : (
          `#${position}`
        )}
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${getMemberGradient(position - 1)} flex items-center justify-center text-[var(--text-inverse)] text-xs font-black shadow-md overflow-hidden ring-2 ring-[var(--surface)]`}
        >
          {member.user.avatarUrl ? (
            <OptimizedImage
              src={member.user.avatarUrl}
              alt={displayName}
              fill
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </div>
        {/* Leader crown */}
        {member.role === 'LEADER' && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 dark:bg-yellow-500 text-gray-900 flex items-center justify-center ring-2 ring-[var(--surface)] shadow-md" aria-label={t('clanDetail.leader')}>
            <Crown size={10} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
            {displayName}
          </h4>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border} flex items-center gap-1 flex-shrink-0`}
          >
            <RoleIcon size={10} />
            {t(roleConfig.labelKey)}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
          <BookOpen size={11} className="inline" />
          {member.contributedScore.toLocaleString()} {t('clanDetail.ptsThisSeason')}
        </p>
      </div>

      {/* XP & Level */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <Zap size={13} className="text-[var(--accent-purple)]" />
          <span className="font-extrabold text-sm text-[var(--text-primary)]">
            {member.user.xpPoints.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-[var(--text-muted)]">{t('clanDetail.level')} {member.user.level}</div>
      </div>
    </motion.div>
    </Link>
  );
}

function MembersSection({ clan }: { clan: ClanData }) {
  const t = useT();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatedContainer animation="fadeInUp" delay={0.5}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-sunken)]/50">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[var(--text-primary)]">
            <Crown className="text-amber-500 dark:text-yellow-500" size={20} />
            {t('clanDetail.clanMembers')}
            <span className="text-sm font-normal text-[var(--text-muted)] ml-1">
              ({clan.memberCount})
            </span>
          </h2>
        </div>

        {/* Members list */}
        {clan.members.length === 0 ? (
          <div className="px-6 py-12 text-center text-[var(--text-muted)]">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('clanDetail.noMembers')}</p>
            <p className="text-xs mt-1">{t('clanDetail.beFirst')}</p>
          </div>
        ) : (
          <motion.div
            variants={shouldReduceMotion ? {} : containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-[var(--border)]"
          >
            {clan.members.map((member, i) => (
              <MemberRow key={member.id} member={member} position={i + 1} />
            ))}
          </motion.div>
        )}
      </div>
    </AnimatedContainer>
  );
}

// ── Main Component ─────────────────────────────────────

interface ClanDetailClientProps {
  clan: ClanData;
  userMembership: { role: 'MEMBER' | 'LEADER' | 'OFFICER' } | null;
  userId: string | null;
}

export default function ClanDetailClient({
  clan,
  userMembership: initialMembership,
  userId,
}: ClanDetailClientProps) {
  const t = useT();
  const [userMembership, setUserMembership] = useState(initialMembership);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  async function handleJoinLeave() {
    setJoining(true);
    setActionError(null);
    try {
      if (userMembership) {
        const res = await fetch(`/api/clans/${clan.id}/leave`, { method: 'POST' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('clanDetail.errorLeave'));
        }
        setUserMembership(null);
      } else {
        const res = await fetch(`/api/clans/${clan.id}/join`, { method: 'POST' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t('clanDetail.errorJoin'));
        }
        setUserMembership({ role: 'MEMBER' });
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setJoining(false);
    }
  }

  const joinedLabel = userMembership
    ? userMembership.role === 'LEADER'
      ? t('clanDetail.youAreLeader')
      : userMembership.role === 'OFFICER'
        ? t('clanDetail.youAreOfficer')
        : t('clanDetail.youAreMember')
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] pb-16" role="main">
      {/* ═══ Hero Banner ═══ */}
      <header className="relative bg-gradient-to-br from-[var(--accent-purple)]/20 via-[var(--primary)]/10 to-[var(--background)] border-b border-[var(--border)] overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, var(--accent-purple) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--primary) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        {/* Glow orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--accent-purple)]/15 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl" aria-hidden="true" />

        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Emblem */}
            <HeroEmblem clan={clan} />

            {/* Info */}
            <motion.div
              className="flex-1 text-center md:text-left"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Badge: season */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-purple)]/15 text-[var(--accent-purple)] text-xs font-bold mb-3">
                <Flame size={13} />
                {t('clanDetail.season')} {clan.currentSeason}
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] mb-3">
                {clan.name}
              </h1>

              <p className="text-[var(--text-secondary)] text-lg max-w-xl leading-relaxed">
                {clan.description || t('clanDetail.defaultDescription')}
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1.5">
                  <Users size={15} className="text-[var(--primary)]" />
                  {clan.memberCount} {t('clanDetail.members')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1.5">
                  <Calendar size={15} className="text-[var(--accent-purple)]" />
                  {t('clanDetail.founded')} {new Date(clan.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1.5">
                  <Hash size={15} className="text-[var(--text-muted)]" />
                  {clan.totalScore.toLocaleString()} {t('clanDetail.totalPts')}
                </span>
              </div>
            </motion.div>

            {/* Join/Leave Button */}
            <motion.div
              className="flex-shrink-0"
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {userId ? (
                <div className="flex flex-col items-center gap-2">
                  {joinedLabel && (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{joinedLabel}</span>
                  )}
                  <button
                    onClick={handleJoinLeave}
                    disabled={joining}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer text-sm ${
                      userMembership
                        ? 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--error)]/40 hover:text-[var(--error)] hover:bg-[var(--error)]/5'
                        : 'bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white hover:shadow-xl hover:shadow-[var(--accent-purple)]/25 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {joining ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : userMembership ? (
                      <>
                        <Shield size={18} />
                        {t('clanDetail.leaveClan')}
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        {t('clanDetail.joinClan')}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-2">{t('clanDetail.loginToJoin')}</p>
                  <Link
                    href="/login"
                    className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white hover:shadow-xl hover:shadow-[var(--accent-purple)]/25 transition-all inline-flex items-center gap-2 text-sm"
                  >
                    <Plus size={18} />
                    {t('clanDetail.joinClan')}
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Error banner */}
        {actionError && (
          <div className="lg:col-span-3 bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] rounded-xl p-4 text-sm font-medium flex items-center gap-3">
            <AlertTriangle size={18} />
            {actionError}
            <button
              onClick={() => setActionError(null)}
              className="ml-auto text-[var(--error)]/70 hover:text-[var(--error)]"
              aria-label={t('clanDetail.closeError')}
            >
              ✕
            </button>
          </div>
        )}

        {/* Left Column: Stats */}
        <div className="space-y-5">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Users}
              label={t('clanDetail.members')}
              value={clan.memberCount.toString()}
              colorClass="bg-[var(--primary)]/15 text-[var(--primary)]"
              index={0}
            />
            <StatCard
              icon={Flame}
              label={t('clanDetail.monthlyScore')}
              value={clan.monthlyScore.toLocaleString()}
              colorClass="bg-[var(--accent-purple)]/15 text-[var(--accent-purple)]"
              index={1}
            />
          </div>

          <SeasonProgress clan={clan} />
          <TotalScoreCard clan={clan} />
        </div>

        {/* Right Column: Members */}
        <div className="lg:col-span-2">
          <MembersSection clan={clan} />
        </div>
      </div>
    </div>
  );
}
