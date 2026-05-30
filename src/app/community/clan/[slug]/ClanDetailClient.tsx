'use client';import {
  motion, useReducedMotion, useSpring, useTransform, useInView
} from 'framer-motion';
import {
  Users, Crown, Shield, Trophy, BookOpen, Flame,
  Plus, Calendar, Swords, Loader2, AlertTriangle,
  Zap, TrendingUp, Edit, Trash2, UserCog,
  ScrollText, X, Clock, Send, UserPlus, Check, XCircle, Search, ChevronRight,
  Upload, ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback, useRef, useEffect } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { useI18n, useT } from '@/i18n';

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

// ── Animated Counter ───────────────────────────────────
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {display}
    </motion.span>
  );
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
      className="relative group"
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[var(--accent-purple)]/30 blur-xl group-hover:blur-2xl transition-all duration-500"
        animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      {/* Emblem container - circular profile pic style */}
      {clan.emblemUrl ? (
        <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-[var(--surface)] shadow-2xl group-hover:ring-[var(--primary)]/40 transition-all duration-300">
          <OptimizedImage
            src={clan.emblemUrl}
            alt={`${t('clanDetail.emblemOf')} ${clan.name}`}
            fill
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      ) : (
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--primary)] flex items-center justify-center shadow-2xl ring-2 ring-[var(--surface)] group-hover:ring-[var(--primary)]/40 transition-all duration-300 overflow-hidden">
          <span className="text-5xl font-black text-white/90">
            {clan.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
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
      className="group bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] rounded-xl p-5 hover:shadow-lg hover:shadow-[var(--primary)]/8 hover:border-[var(--primary)]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
            <AnimatedCounter value={parseInt(value.replace(/[^0-9]/g, '')) || 0} />
          </p>
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
      <div className="bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:border-[var(--primary)]/20 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[var(--text-primary)]">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <Flame className="text-red-500" size={18} />
            </div>
            {t('clanDetail.season')} {clan.currentSeason}
          </h2>
          <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface-sunken)]/80 backdrop-blur-sm px-3 py-1 rounded-full border border-[var(--border)]">
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
          <div className="relative h-4 bg-[var(--surface-sunken)] rounded-full overflow-hidden shadow-inner">
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
      <div className="bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-lg hover:shadow-[var(--warning)]/5 hover:border-[var(--warning)]/20 transition-all duration-200 group">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--warning)]/10 to-transparent rounded-bl-full group-hover:from-[var(--warning)]/20 transition-all duration-500" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[var(--accent-purple)]/5 to-transparent rounded-tr-full" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--warning)]/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
  isLeader,
  currentUserId,
  onPromote,
  promoting,
}: {
  member: ClanMember;
  position: number;
  isLeader: boolean;
  currentUserId: string | null;
  onPromote: (memberId: string, newRole: string) => void;
  promoting: string | null;
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
        className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-sunken)]/50 transition-all duration-200 cursor-pointer relative"
      >
      {/* Left gradient accent on hover */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-gradient-to-b from-[var(--primary)] to-[var(--accent-purple)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
        {member.user.avatarUrl ? (
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[var(--surface)] shadow-md group-hover:ring-[var(--primary)]/40 transition-all duration-300">
            <OptimizedImage
              src={member.user.avatarUrl}
              alt={displayName}
              fill
              className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        ) : (
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br ${getMemberGradient(position - 1)} flex items-center justify-center text-[var(--text-inverse)] text-xs font-black shadow-md overflow-hidden ring-2 ring-[var(--surface)] group-hover:ring-[var(--primary)]/40 transition-all duration-300`}
          >
            {getInitials(displayName)}
          </div>
        )}
        {/* Leader crown */}
        {member.role === 'LEADER' && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 dark:bg-yellow-500 text-gray-900 flex items-center justify-center ring-2 ring-[var(--surface)] shadow-md group-hover:scale-110 transition-transform duration-300" aria-label={t('clanDetail.leader')}>
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

      {/* Leader actions */}
      {isLeader && member.userId !== currentUserId && member.role !== 'LEADER' && (
        <div className="flex items-center gap-1 flex-shrink-0 mr-2" onClick={(e) => e.stopPropagation()}>
          {member.role !== 'OFFICER' && (
            <button
              onClick={() => onPromote(member.userId, 'OFFICER')}
              disabled={promoting === member.userId}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 transition-all cursor-pointer hover:scale-110 active:scale-95"
              title={t('clanDetail.promoteToOfficer')}
            >
              {promoting === member.userId ? <Loader2 size={14} className="animate-spin" /> : <UserCog size={14} />}
            </button>
          )}
          {member.role === 'OFFICER' && (
            <button
              onClick={() => onPromote(member.userId, 'LEADER')}
              disabled={promoting === member.userId}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer hover:scale-110 active:scale-95"
              title={t('clanDetail.transferLeadership')}
            >
              {promoting === member.userId ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
            </button>
          )}
          <button
            onClick={() => onPromote(member.userId, 'MEMBER')}
            disabled={promoting === member.userId}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all cursor-pointer hover:scale-110 active:scale-95"
            title={t('clanDetail.demote')}
          >
            {promoting === member.userId ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
          </button>
        </div>
      )}

      {/* XP & Level */}
      <div className="text-right flex-shrink-0 mr-1">
        <div className="flex items-center gap-1 justify-end">
          <Zap size={13} className="text-[var(--accent-purple)]" />
          <span className="font-extrabold text-sm text-[var(--text-primary)]">
            {member.user.xpPoints.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-[var(--text-muted)]">{t('clanDetail.level')} {member.user.level}</div>
      </div>

      {/* Chevron on hover */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ChevronRight size={18} className="text-[var(--text-tertiary)]" />
      </div>
    </motion.div>
    </Link>
  );
}

function MembersSection({ clan, isLeader, currentUserId, onPromote, promoting }: { clan: ClanData; isLeader: boolean; currentUserId: string | null; onPromote: (memberId: string, newRole: string) => void; promoting: string | null }) {
  const t = useT();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatedContainer animation="fadeInUp" delay={0.5}>
      <div className="bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all duration-200">
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="px-6 py-12 text-center text-[var(--text-muted)]"
          >
            <div className="relative inline-flex mb-3">
              <div className="absolute inset-0 rounded-full bg-[var(--primary)]/10 blur-xl" />
              <Users size={36} className="relative opacity-40 text-[var(--primary)]" />
            </div>
            <p className="text-sm">{t('clanDetail.noMembers')}</p>
            <p className="text-xs mt-1">{t('clanDetail.beFirst')}</p>
          </motion.div>
        ) : (
          <motion.div
            variants={shouldReduceMotion ? {} : containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-[var(--border)]"
          >
            {clan.members.map((member, i) => (
              <MemberRow key={member.id} member={member} position={i + 1} isLeader={isLeader} currentUserId={currentUserId} onPromote={onPromote} promoting={promoting} />
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
  const { locale, t } = useI18n();
  const [userMembership, setUserMembership] = useState(initialMembership);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState(clan.name);
  const [editDescription, setEditDescription] = useState(clan.description || '');
  const [editEmblemUrl, setEditEmblemUrl] = useState(clan.emblemUrl || '');
  const [saving, setSaving] = useState(false);
  const [emblemUploading, setEmblemUploading] = useState(false);
  const emblemInputRef = useRef<HTMLInputElement>(null);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [auditLogsOpen, setAuditLogsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[] | null>(null);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);
  // ── Join Request State ──
  const [myPendingRequest, setMyPendingRequest] = useState<any | null>(null);
  const [loadingMyRequest, setLoadingMyRequest] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [joinRequestSending, setJoinRequestSending] = useState(false);
  const [joinRequestError, setJoinRequestError] = useState<string | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState(false);

  // ── Invite State ──
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loadingPendingInvites, setLoadingPendingInvites] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const isLeader = userMembership?.role === 'LEADER';
  const isOfficer = userMembership?.role === 'OFFICER';
  const canViewAudit = userMembership?.role === 'LEADER' || userMembership?.role === 'OFFICER';
  const canInvite = userMembership?.role === 'LEADER' || userMembership?.role === 'OFFICER';

  // ── Fetch user's pending join request on mount ──
  useEffect(() => {
    if (userId && !userMembership) {
      setLoadingMyRequest(prev => prev ? prev : true);
      fetch(`/api/clans/${clan.id}/join-requests?status=PENDING`)
        .then(res => res.ok ? res.json() : { joinRequests: [] })
        .then(data => {
          const myRequest = data.joinRequests?.find((r: any) => r.userId === userId);
          if (myRequest) setMyPendingRequest(myRequest);
        })
        .catch(() => {})
        .finally(() => setLoadingMyRequest(false));
    }
  }, [userId, userMembership, clan.id]);

  async function handleSendJoinRequest() {
    setJoinRequestSending(true);
    setJoinRequestError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: joinRequestMessage || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorJoinRequest'));
      }
      const data = await res.json();
      setMyPendingRequest(data.joinRequest);
      setJoinRequestMessage('');
    } catch (err: any) {
      setJoinRequestError(err.message);
    } finally {
      setJoinRequestSending(false);
    }
  }

  async function handleCancelJoinRequest() {
    if (!myPendingRequest) return;
    setCancellingRequest(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}/join-requests/${myPendingRequest.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorCancelRequest'));
      }
      setMyPendingRequest(null);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setCancellingRequest(false);
    }
  }

  async function loadJoinRequests() {
    setJoinRequestsLoading(true);
    setJoinRequestError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}/join-requests?all=1`);
      if (!res.ok) throw new Error(t('clanDetail.errorLoadRequests'));
      const data = await res.json();
      setJoinRequests(data.joinRequests || []);
    } catch (err: any) {
      setJoinRequestError(err.message);
    } finally {
      setJoinRequestsLoading(false);
    }
  }

  async function handleReviewJoinRequest(requestId: string, action: 'APPROVED' | 'REJECTED') {
    setReviewingRequest(requestId);
    try {
      const res = await fetch(`/api/clans/${clan.id}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: action === 'REJECTED' ? t('clanDetail.requestRejected') : undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorProcessRequest'));
      }
      // Refresh the list
      loadJoinRequests();
      // If approved and it was the current user's request, update membership
      if (action === 'APPROVED') {
        const reviewed = joinRequests.find((r: any) => r.id === requestId);
        if (reviewed?.userId === userId) {
          setMyPendingRequest(null);
          setUserMembership({ role: 'MEMBER' });
          window.location.reload();
        }
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setReviewingRequest(null);
    }
  }

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

  async function handleEmblemUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setEditError(t('clanCreate.errorImageType'));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setEditError(t('clanCreate.errorImageSize'));
      return;
    }

    setEmblemUploading(true);
    setEditError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('clanCreate.errorImageUpload'));
      }

      const data = await res.json();
      setEditEmblemUrl(data.url);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEmblemUploading(false);
      if (emblemInputRef.current) emblemInputRef.current.value = '';
    }
  }

  async function handleEdit() {
    setSaving(true);
    setEditError(null);
    try {
      const payload: Record<string, string> = {};
      if (editName !== clan.name) payload.name = editName;
      if (editDescription !== (clan.description || '')) payload.description = editDescription;
      if (editEmblemUrl !== (clan.emblemUrl || '')) payload.emblemUrl = editEmblemUrl;

      const res = await fetch(`/api/clans/${clan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorUpdate'));
      }
      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorDelete'));
      }
      window.location.href = '/community/clans';
    } catch (err: any) {
      setActionError(err.message);
      setDeleting(false);
    } finally {
      setSaving(false);
    }
  }

  async function handlePromote(memberId: string, newRole: string) {
    setPromoting(memberId);
    setActionError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorChangeRole'));
      }
      window.location.reload();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setPromoting(null);
    }
  }

  // ── Invitation Handlers ──
  const loadPendingInvites = useCallback(async () => {
    if (!canInvite) return;
    setLoadingPendingInvites(prev => prev ? prev : true);
    try {
      const res = await fetch(`/api/clans/${clan.id}/invitations/pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingInvites(data.invitations || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingPendingInvites(false);
    }
  }, [clan.id, canInvite]);

  useEffect(() => {
    if (inviteOpen) {
      loadPendingInvites();
    }
  }, [inviteOpen, loadPendingInvites]);

  const handleSearchUsers = useCallback((query: string) => {
    setInviteSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&excludeClanId=${clan.id}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [clan.id]);

  const handleSendInvite = async (inviteeId: string) => {
    setSendingInvite(inviteeId);
    setInviteSuccess(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}/invitations/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('clanDetail.errorSendInvite'));
      }
      setInviteSuccess(inviteeId);
      setTimeout(() => setInviteSuccess(null), 2000);
      // Refresh pending invites list
      loadPendingInvites();
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== inviteeId));
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSendingInvite(null);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/clans/${clan.id}/invitations/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      if (res.ok) {
        setPendingInvites(prev => prev.filter(inv => inv.id !== invitationId));
      }
    } catch {
      // Silently fail
    }
  };

  const handleViewAuditLogs = useCallback(async () => {
    setAuditLogsOpen(true);
    setAuditLogsLoading(true);
    setAuditLogsError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}/audit-logs`);
      if (!res.ok) throw new Error((await res.json()).error || t('clanDetail.errorLoadAudit'));
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      setAuditLogsError(err.message);
    } finally {
      setAuditLogsLoading(false);
    }
  }, [clan.id, t]);

  const joinedLabel = userMembership
    ? userMembership.role === 'LEADER'
      ? t('clanDetail.youAreLeader')
      : userMembership.role === 'OFFICER'
        ? t('clanDetail.youAreOfficer')
        : t('clanDetail.youAreMember')
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] pb-16">
      {/* ═══ Hero Banner ═══ */}
      <header className="relative bg-gradient-to-br from-[var(--accent-purple)]/15 via-[var(--primary)]/8 to-[var(--surface)]/50 border-b border-[var(--border)] overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, var(--accent-purple) 1px, transparent 1px), radial-gradient(circle at 80% 70%, var(--primary) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        {/* Glow orbs - enhanced */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[var(--primary)]/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[var(--primary)]/3 to-[var(--accent-purple)]/3 rounded-full blur-3xl" aria-hidden="true" />

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

              {/* Meta pills - glass style */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-200 rounded-full px-3 py-1.5">
                  <Users size={15} className="text-[var(--primary)]" />
                  {clan.memberCount} {t('clanDetail.members')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--accent-purple)]/30 transition-all duration-200 rounded-full px-3 py-1.5">
                  <Calendar size={15} className="text-[var(--accent-purple)]" />
                  {t('clanDetail.founded')} {new Date(clan.createdAt).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--warning)]/30 transition-all duration-200 rounded-full px-3 py-1.5">
                  <Trophy size={15} className="text-[var(--warning)]" />
                  {clan.totalScore.toLocaleString()} {t('clanDetail.totalPts')}
                </span>
              </div>
            </motion.div>

            {/* Join/Leave Button - glass style */}
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
                  {userMembership ? (
                    <button
                      onClick={handleJoinLeave}
                      disabled={joining}
                      className="px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer text-sm bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--error)]/40 hover:text-[var(--error)] hover:bg-[var(--error)]/5"
                    >
                      {joining ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Shield size={18} />
                          {t('clanDetail.leaveClan')}
                        </>
                      )}
                    </button>
                  ) : myPendingRequest ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400">
                        <Clock size={18} />
                        {t('clanDetail.requestPending')}
                      </div>
                      <button
                        onClick={handleCancelJoinRequest}
                        disabled={cancellingRequest}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {cancellingRequest ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {t('clanDetail.cancelRequest')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setJoinRequestsOpen(true)}
                      className="px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer text-sm bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white hover:shadow-xl hover:shadow-[var(--accent-purple)]/25 hover:scale-105 active:scale-95"
                    >
                      <UserPlus size={18} />
                      {t('clanDetail.sendJoinRequest')}
                    </button>
                  )}
                  {loadingMyRequest && (
                    <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-2">{t('clanDetail.loginToJoin')}</p>
                  <Link
                    href="/auth/login"
                    className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white hover:shadow-xl hover:shadow-[var(--accent-purple)]/25 transition-all inline-flex items-center gap-2 text-sm"
                  >
                    <Plus size={18} />
                    {t('clanDetail.joinClan')}
                  </Link>
                </div>
              )}
            </motion.div>

          </div>

          {/* ═══ Management Toolbar ═══ */}
          {userId && (isLeader || isOfficer) && (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-6"
            >
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 bg-[var(--surface)]/40 backdrop-blur-md border border-[var(--border)]/60 rounded-2xl px-4 py-3 shadow-sm">
                <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mr-2 hidden sm:inline-flex items-center gap-1.5">
                  <Shield size={12} />
                  {t('clanDetail.management') || 'Gestión'}
                </span>
                <div className="w-px h-5 bg-[var(--border)]/50 hidden sm:block" />
                
                <button
                  onClick={() => { setEditName(clan.name); setEditDescription(clan.description || ''); setEditEmblemUrl(clan.emblemUrl || ''); setEditNameError(null); setEditError(null); setEditing(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  <Edit size={14} />
                  {t('clanDetail.editClan')}
                </button>
                
                <button
                  onClick={() => setDeleting(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:border-[var(--error)]/40 hover:bg-[var(--error)]/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  <Trash2 size={14} />
                  {t('clanDetail.deleteClan')}
                </button>
                
                <div className="w-px h-5 bg-[var(--border)]/30" />
                
                {canInvite && (
                  <button
                    onClick={() => setInviteOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                  >
                    <UserPlus size={14} />
                    {t('clanDetail.inviteMembers')}
                  </button>
                )}
                
                {(isLeader || isOfficer) && (
                  <button
                    onClick={() => { setJoinRequestsOpen(true); loadJoinRequests(); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer relative"
                  >
                    <Clock size={14} />
                    {t('clanDetail.manageRequests')}
                  </button>
                )}
                
                {canViewAudit && (
                  <button
                    onClick={handleViewAuditLogs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-purple)] hover:border-[var(--accent-purple)]/40 hover:bg-[var(--accent-purple)]/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                  >
                    <ScrollText size={14} />
                    {t('clanDetail.viewAuditLogs')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* ═══ Edit Modal ═══ */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditing(false); setEditError(null); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-black/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/3 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/15 flex items-center justify-center">
                  <Edit size={18} className="text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('clanDetail.editClan')}</h3>
                   <p className="text-xs text-[var(--text-muted)]">{t('clanDetail.editClanDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => { setEditing(false); setEditError(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Error */}
              {editError && (
                <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} />
                  {editError}
                </div>
              )}
              {editNameError && (
                <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} />
                  {editNameError}
                </div>
              )}

              {/* Clan Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  {t('clanCreate.nameLabel') || 'Nombre del clan'} <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditNameError(null);
                    if (e.target.value.length > 50) {
                      setEditNameError(t('clanCreate.nameMax') || 'Máximo 50 caracteres');
                    }
                  }}
                  maxLength={50}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  placeholder={t('clanCreate.namePlaceholder') || 'Nombre de tu clan'}
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{editName.length}/50</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  {t('clanDetail.description')}
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none transition-all"
                  placeholder={t('clanDetail.descriptionPlaceholder')}
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{editDescription.length}/500</p>
              </div>

              {/* Emblem Image */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  {t('clanCreate.emblemLabel') || 'Emblema del clan'}
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--surface-sunken)] border border-[var(--border)]"
                  >
                    {editEmblemUrl ? (
                      <img
                        src={editEmblemUrl}
                        alt="Emblema"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={24} className="text-[var(--text-tertiary)]" />
                      </div>
                    )}
                  </div>
                  {/* Upload controls */}
                  <div className="flex-1">
                    <input
                      ref={emblemInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      onChange={handleEmblemUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => emblemInputRef.current?.click()}
                      disabled={emblemUploading}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {emblemUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {emblemUploading
                        ? (t('clanCreate.emblemUploading') || 'Subiendo...')
                        : (editEmblemUrl
                          ? (t('clanCreate.emblemChange') || 'Cambiar imagen')
                          : (t('clanCreate.emblemUpload') || 'Subir imagen'))}
                    </button>
                    {editEmblemUrl && (
                      <button
                        type="button"
                        onClick={() => setEditEmblemUrl('')}
                        className="mt-1.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors cursor-pointer"
                      >
                        {t('clanDetail.removeEmblem')}
                      </button>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                      {t('clanCreate.emblemHint') || 'PNG, JPG, WebP · Máx 5MB'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-[var(--border)] bg-gradient-to-r from-transparent to-[var(--accent-purple)]/3">
              <button
                onClick={() => { setEditing(false); setEditError(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]/30 hover:bg-[var(--surface-sunken)]/50 transition-all cursor-pointer active:scale-[0.98]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEdit}
                disabled={saving || !!editNameError}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white hover:shadow-lg hover:shadow-[var(--accent-purple)]/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {saving ? (t('common.saving') || 'Guardando...') : (t('common.save') || 'Guardar')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ Audit Logs Modal ═══ */}
      {auditLogsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setAuditLogsOpen(false); setAuditLogs(null); setAuditLogsError(null); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl shadow-black/20 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent-purple)]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-purple)]/15 flex items-center justify-center">
                  <ScrollText size={18} className="text-[var(--accent-purple)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('clanDetail.auditLogs')}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{clan.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setAuditLogsOpen(false); setAuditLogs(null); setAuditLogsError(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all cursor-pointer"
                aria-label={t('clanDetail.auditLogsClose')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {auditLogsLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]"
                >
                  <Loader2 size={32} className="animate-spin mb-3" />
                  <p className="text-sm">{t('clanDetail.auditLogsLoading')}</p>
                </motion.div>
              ) : auditLogsError ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-[var(--error)]"
                >
                  <AlertTriangle size={32} className="mb-3" />
                  <p className="text-sm font-medium">{auditLogsError}</p>
                </motion.div>
              ) : auditLogs && auditLogs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]"
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent-purple)]/10 blur-xl" />
                    <ScrollText size={40} className="relative opacity-60 text-[var(--accent-purple)]" />
                  </div>
                  <p className="text-sm">{t('clanDetail.auditLogsEmpty')}</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {auditLogs?.map((log: any, idx: number) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--surface-sunken)]/50 hover:border hover:border-[var(--border)] transition-all duration-200"
                    >
                      {/* Action icon */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-purple)]/10 to-[var(--primary)]/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock size={14} className="text-[var(--accent-purple)]" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] uppercase tracking-wider border border-[var(--accent-purple)]/20">
                            {log.action}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] mt-1">
                          {log.details || log.action}
                        </p>
                        {log.user && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 flex items-center gap-1">
                            <Users size={11} />
                            {log.user.username || log.user.displayName}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ Invite Members Modal ═══ */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:items-center bg-black/60 backdrop-blur-sm" onClick={() => { setInviteOpen(false); setInviteSearch(''); setSearchResults([]); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl w-full max-w-lg mx-4 shadow-2xl shadow-black/20 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/3 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/15 flex items-center justify-center">
                  <UserPlus size={18} className="text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('clanDetail.inviteMembers')}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('clanDetail.inviteDescription')}</p>
                </div>
              </div>
              <button
                onClick={() => { setInviteOpen(false); setInviteSearch(''); setSearchResults([]); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={inviteSearch}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder={t('clanDetail.inviteSearchPlaceholder')}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)]/80 backdrop-blur-sm pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  autoFocus
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              </div>

              {/* Search results */}
              {searching && (
                <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span className="text-sm">{t('common.searching')}</span>
                </div>
              )}

              {!searching && inviteSearch.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <div className="relative inline-flex mb-3">
                    <div className="absolute inset-0 rounded-full bg-[var(--primary)]/10 blur-xl" />
                    <Users size={36} className="relative opacity-40 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm">{t('clanDetail.inviteNoResults')}</p>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('clanDetail.inviteSearchResults')}</p>
                  {searchResults.map((user: any) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-sunken)]/50 hover:border hover:border-[var(--border)] transition-all duration-200"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                            {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          @{user.username} · {t('clanDetail.level')} {user.level}
                        </p>
                      </div>
                      {/* Invite button */}
                      {inviteSuccess === user.id ? (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500"
                        >
                          <Check size={14} />
                          {t('clanDetail.inviteSent')}
                        </motion.span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(user.id)}
                          disabled={sendingInvite === user.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white hover:shadow-lg hover:shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingInvite === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <><Send size={12} /> {t('clanDetail.inviteButton')}</>
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {t('clanDetail.pendingInvitations')} ({pendingInvites.length})
                    </p>
                    {loadingPendingInvites && <Loader2 size={12} className="animate-spin text-[var(--text-tertiary)]" />}
                  </div>
                  <div className="space-y-2">
                    {pendingInvites.map((inv: any) => (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface-sunken)]/60 backdrop-blur-sm border border-[var(--border)]/50"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--warning)]/10 text-[var(--warning)] flex-shrink-0">
                          <Clock size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {inv.invitee.displayName || inv.invitee.username}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            @{inv.invitee.username}
                          </p>
                        </div>
                        {(isLeader || inv.inviterId === userId) && (
                          <button
                            onClick={() => handleCancelInvite(inv.id)}
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all cursor-pointer active:scale-90"
                            title={t('clanDetail.cancelInvite')}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ Join Requests Modal ═══ */}
      {joinRequestsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:items-center bg-black/60 backdrop-blur-sm" onClick={() => { setJoinRequestsOpen(false); setJoinRequestMessage(''); setJoinRequestError(null); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl w-full max-w-lg mx-4 shadow-2xl shadow-black/20 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  {isLeader || isOfficer ? (
                    <Clock size={18} className="text-amber-500" />
                  ) : (
                    <UserPlus size={18} className="text-[var(--primary)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {isLeader || isOfficer
                      ? t('clanDetail.manageRequests')
                      : t('clanDetail.sendJoinRequest')}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isLeader || isOfficer
                      ? t('clanDetail.manageRequestsDesc')
                      : t('clanDetail.sendJoinRequestDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setJoinRequestsOpen(false); setJoinRequestMessage(''); setJoinRequestError(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Leader/Officer: Show pending requests */}
              {(isLeader || isOfficer) ? (
                <>
                  {joinRequestsLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]"
                    >
                      <Loader2 size={24} className="animate-spin mb-2" />
                      <p className="text-sm">{t('common.loading')}</p>
                    </motion.div>
                  ) : joinRequests.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]"
                    >
                      <div className="relative mb-3">
                        <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl" />
                        <UserPlus size={36} className="relative opacity-40 text-amber-500" />
                      </div>
                      <p className="text-sm font-medium">{t('clanDetail.noPendingRequests')}</p>
                      <p className="text-xs mt-1">{t('clanDetail.noPendingRequestsDesc')}</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        {t('clanDetail.pendingRequests')} ({joinRequests.length})
                      </p>
                      {joinRequests.map((req: any) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:shadow-sm ${
                            req.status === 'PENDING'
                              ? 'bg-amber-500/5 border border-amber-500/20 backdrop-blur-sm'
                              : 'bg-[var(--surface-sunken)]/50 border border-[var(--border)]'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20">
                            {req.user.avatarUrl ? (
                              <img src={req.user.avatarUrl} alt={req.user.displayName || req.user.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                                {(req.user.displayName || req.user.username).slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {req.user.displayName || req.user.username}
                              </p>
                              <span className="text-xs text-[var(--text-muted)]">
                                @{req.user.username}
                              </span>
                              {req.status === 'PENDING' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  {t('clanDetail.pending')}
                                </span>
                              )}
                              {req.status === 'APPROVED' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  {t('clanDetail.approved')}
                                </span>
                              )}
                              {req.status === 'REJECTED' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--error)]/15 text-[var(--error)]">
                                  {t('clanDetail.rejected')}
                                </span>
                              )}
                              {req.status === 'CANCELLED' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--text-muted)]/15 text-[var(--text-muted)]">
                                  {t('clanDetail.cancelled')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[var(--text-tertiary)]">
                                {t('clanDetail.level')} {req.user.level} · {req.user.xpPoints.toLocaleString()} {t('common.xp')}
                              </span>
                            </div>
                            {req.message && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1.5 italic bg-[var(--surface-sunken)]/50 rounded-lg px-3 py-1.5">
                                &ldquo;{req.message}&rdquo;
                              </p>
                            )}
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                              {new Date(req.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {/* Actions */}
                          {req.status === 'PENDING' && (isLeader || isOfficer) && (
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleReviewJoinRequest(req.id, 'APPROVED')}
                                disabled={reviewingRequest === req.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                {reviewingRequest === req.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <><Check size={12} /> {t('common.approve')}</>
                                )}
                              </button>
                              <button
                                onClick={() => handleReviewJoinRequest(req.id, 'REJECTED')}
                                disabled={reviewingRequest === req.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:border-[var(--error)]/40 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle size={12} /> {t('common.reject')}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Non-member: Show send request form */
                <>
                  {myPendingRequest ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Clock size={28} className="text-amber-500" />
                      </div>
                      <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">{t('clanDetail.requestSent')}</h4>
                      <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                        {t('clanDetail.requestSentDesc')}
                      </p>
                      {myPendingRequest.message && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-3 italic bg-[var(--surface-sunken)]/50 rounded-lg px-4 py-2 max-w-sm">
                          &ldquo;{myPendingRequest.message}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-3">
                        {t('clanDetail.requestedAt')} {new Date(myPendingRequest.createdAt).toLocaleString()}
                      </p>
                      <button
                        onClick={handleCancelJoinRequest}
                        disabled={cancellingRequest}
                        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:border-[var(--error)]/40 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {cancellingRequest ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        {t('clanDetail.cancelRequest')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                          {t('clanDetail.joinRequestMessage')}
                        </label>
                        <textarea
                          value={joinRequestMessage}
                          onChange={(e) => setJoinRequestMessage(e.target.value.slice(0, 500))}
                          rows={4}
                          maxLength={500}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none transition-all"
                          placeholder={t('clanDetail.joinRequestPlaceholder')}
                        />
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-[var(--text-tertiary)]">{t('clanDetail.joinRequestHint')}</p>
                          <span className="text-xs text-[var(--text-muted)]">{joinRequestMessage.length}/500</span>
                        </div>
                      </div>

                      {joinRequestError && (
                        <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-lg px-3 py-2">
                          <AlertTriangle size={14} />
                          {joinRequestError}
                        </div>
                      )}

                      <button
                        onClick={handleSendJoinRequest}
                        disabled={joinRequestSending}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white hover:shadow-lg hover:shadow-[var(--accent-purple)]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        {joinRequestSending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <><Send size={18} /> {t('clanDetail.sendRequest')}</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ Delete Confirmation ═══ */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-black/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-12 h-12 rounded-full bg-[var(--error)]/15 flex items-center justify-center flex-shrink-0"
              >
                <AlertTriangle size={24} className="text-[var(--error)]" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('clanDetail.deleteConfirmTitle')}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{t('clanDetail.deleteConfirmDesc')}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleting(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]/50 transition-all cursor-pointer active:scale-[0.98]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-[var(--error)] to-red-600 text-white hover:shadow-lg hover:shadow-[var(--error)]/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {saving ? t('common.deleting') : t('clanDetail.deleteClan')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ Main Content ═══ */}
      <motion.div
        className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
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
          <MembersSection clan={clan} isLeader={isLeader} currentUserId={userId} onPromote={handlePromote} promoting={promoting} />
        </div>
      </motion.div>
    </div>
  );
}
