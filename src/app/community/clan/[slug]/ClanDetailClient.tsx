'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Users, Crown, Shield, Trophy, BookOpen, Flame,
  Plus, Calendar, Swords, Loader2, AlertTriangle,
  Zap, TrendingUp, Hash, Edit, Trash2, UserCog,
  ScrollText, X, Clock, Send, UserPlus, Check, XCircle, Search,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback, useRef, useEffect } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { useT } from '@/i18n';

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
      {clan.emblemUrl ? (
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-[var(--surface)] shadow-2xl">
          <OptimizedImage
            src={clan.emblemUrl}
            alt={`${t('clanDetail.emblemOf')} ${clan.name}`}
            fill
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--primary)] flex items-center justify-center text-6xl shadow-2xl ring-4 ring-[var(--surface)] overflow-hidden">
          <span role="img" aria-label="Corona">👑</span>
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
        {member.user.avatarUrl ? (
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[var(--surface)] shadow-md">
            <OptimizedImage
              src={member.user.avatarUrl}
              alt={displayName}
              fill
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br ${getMemberGradient(position - 1)} flex items-center justify-center text-[var(--text-inverse)] text-xs font-black shadow-md overflow-hidden ring-2 ring-[var(--surface)]`}
          >
            {getInitials(displayName)}
          </div>
        )}
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

      {/* Leader actions */}
      {isLeader && member.userId !== currentUserId && member.role !== 'LEADER' && (
        <div className="flex items-center gap-1 flex-shrink-0 mr-2" onClick={(e) => e.stopPropagation()}>
          {member.role !== 'OFFICER' && (
            <button
              onClick={() => onPromote(member.userId, 'OFFICER')}
              disabled={promoting === member.userId}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 transition-all cursor-pointer"
              title={t('clanDetail.promoteToOfficer')}
            >
              {promoting === member.userId ? <Loader2 size={14} className="animate-spin" /> : <UserCog size={14} />}
            </button>
          )}
          {member.role === 'OFFICER' && (
            <button
              onClick={() => onPromote(member.userId, 'LEADER')}
              disabled={promoting === member.userId}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
              title={t('clanDetail.transferLeadership')}
            >
              {promoting === member.userId ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
            </button>
          )}
          <button
            onClick={() => onPromote(member.userId, 'MEMBER')}
            disabled={promoting === member.userId}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all cursor-pointer"
            title={t('clanDetail.demote')}
          >
            {promoting === member.userId ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
          </button>
        </div>
      )}

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

function MembersSection({ clan, isLeader, currentUserId, onPromote, promoting }: { clan: ClanData; isLeader: boolean; currentUserId: string | null; onPromote: (memberId: string, newRole: string) => void; promoting: string | null }) {
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
  const t = useT();
  const [userMembership, setUserMembership] = useState(initialMembership);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editDescription, setEditDescription] = useState(clan.description || '');
  const [editEmblemUrl, setEditEmblemUrl] = useState(clan.emblemUrl || '');
  const [saving, setSaving] = useState(false);
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
      setLoadingMyRequest(true);
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
        throw new Error(data.error || 'Error al cancelar solicitud');
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
      if (!res.ok) throw new Error('Error al cargar solicitudes');
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
        body: JSON.stringify({ action, reason: action === 'REJECTED' ? 'Solicitud rechazada' : undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar solicitud');
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

  async function handleEdit() {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/clans/${clan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDescription, emblemUrl: editEmblemUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }
      clan.description = editDescription;
      clan.emblemUrl = editEmblemUrl;
      setEditing(false);
    } catch (err: any) {
      setActionError(err.message);
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
        throw new Error(data.error || 'Error al eliminar');
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
        throw new Error(data.error || 'Error al cambiar rol');
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
    setLoadingPendingInvites(true);
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
        throw new Error(data.error || 'Error al enviar invitación');
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

            {/* ═══ Leader & Officer Management ═══ */}
            {userId && (isLeader || isOfficer) && (
              <motion.div
                className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6 pt-6 border-t border-[var(--border)]/50"
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <button
                  onClick={() => { setEditDescription(clan.description || ''); setEditEmblemUrl(clan.emblemUrl || ''); setEditing(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all cursor-pointer"
                >
                  <Edit size={16} />
                  {t('clanDetail.editClan')}
                </button>
                <button
                  onClick={() => setDeleting(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:border-[var(--error)]/40 hover:bg-[var(--error)]/5 transition-all cursor-pointer"
                >
                  <Trash2 size={16} />
                  {t('clanDetail.deleteClan')}
                </button>
                {/* ═══ Audit Logs Button ═══ */}
                {/* ═══ Invite Button ═══ */}
                {canInvite && (
                  <button
                    onClick={() => setInviteOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all cursor-pointer"
                  >
                    <UserPlus size={16} />
                    {t('clanDetail.inviteMembers')}
                  </button>
                )}
                {(isLeader || isOfficer) && (
                  <button
                    onClick={() => { setJoinRequestsOpen(true); loadJoinRequests(); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all cursor-pointer relative"
                  >
                    <Clock size={16} />
                    {t('clanDetail.manageRequests')}
                  </button>
                )}
                {canViewAudit && (
                  <button
                    onClick={async () => {
                      setAuditLogsOpen(true);
                      setAuditLogsLoading(true);
                      setAuditLogsError(null);
                      try {
                        const res = await fetch(`/api/clans/${clan.id}/audit-logs`);
                        if (!res.ok) throw new Error((await res.json()).error || 'Error al cargar auditoría');
                        const data = await res.json();
                        setAuditLogs(data.logs || []);
                      } catch (err: any) {
                        setAuditLogsError(err.message);
                      } finally {
                        setAuditLogsLoading(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-purple)] hover:border-[var(--accent-purple)]/40 hover:bg-[var(--accent-purple)]/5 transition-all cursor-pointer"
                  >
                    <ScrollText size={16} />
                    {t('clanDetail.viewAuditLogs')}
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Edit Modal ═══ */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{t('clanDetail.editClan')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('clanDetail.description')}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  placeholder={t('clanDetail.descriptionPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('clanDetail.emblemUrl')}</label>
                <input
                  value={editEmblemUrl}
                  onChange={(e) => setEditEmblemUrl(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
                {t('common.cancel')}
              </button>
              <button onClick={handleEdit} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Audit Logs Modal ═══ */}
      {auditLogsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setAuditLogsOpen(false); setAuditLogs(null); setAuditLogsError(null); }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
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
                <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
                  <Loader2 size={32} className="animate-spin mb-3" />
                  <p className="text-sm">{t('clanDetail.auditLogsLoading')}</p>
                </div>
              ) : auditLogsError ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--error)]">
                  <AlertTriangle size={32} className="mb-3" />
                  <p className="text-sm font-medium">{auditLogsError}</p>
                </div>
              ) : auditLogs && auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
                  <ScrollText size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">{t('clanDetail.auditLogsEmpty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--surface-sunken)]/50 transition-colors"
                    >
                      {/* Action icon */}
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-sunken)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock size={14} className="text-[var(--text-tertiary)]" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] uppercase tracking-wider">
                            {log.action}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] mt-1">
                          {log.details || log.action}
                        </p>
                        {log.user && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {t('clanDetail.auditLogsUser')}: {log.user.username || log.user.displayName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Invite Members Modal ═══ */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:items-center bg-black/60 backdrop-blur-sm" onClick={() => { setInviteOpen(false); setInviteSearch(''); setSearchResults([]); }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
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
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t('clanDetail.inviteNoResults')}</p>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('clanDetail.inviteSearchResults')}</p>
                  {searchResults.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-sunken)]/50 transition-colors"
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
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                          <Check size={14} />
                          {t('clanDetail.inviteSent')}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(user.id)}
                          disabled={sendingInvite === user.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingInvite === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <><Send size={12} /> {t('clanDetail.inviteButton')}</>
                          )}
                        </button>
                      )}
                    </div>
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
                      <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface-sunken)]/50">
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
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all cursor-pointer"
                            title={t('clanDetail.cancelInvite')}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Join Requests Modal ═══ */}
      {joinRequestsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:items-center bg-black/60 backdrop-blur-sm" onClick={() => { setJoinRequestsOpen(false); setJoinRequestMessage(''); setJoinRequestError(null); }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
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
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                      <Loader2 size={24} className="animate-spin mb-2" />
                      <p className="text-sm">{t('common.loading')}</p>
                    </div>
                  ) : joinRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                      <UserPlus size={36} className="mb-2 opacity-40" />
                      <p className="text-sm font-medium">{t('clanDetail.noPendingRequests')}</p>
                      <p className="text-xs mt-1">{t('clanDetail.noPendingRequestsDesc')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        {t('clanDetail.pendingRequests')} ({joinRequests.length})
                      </p>
                      {joinRequests.map((req: any) => (
                        <div
                          key={req.id}
                          className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                            req.status === 'PENDING'
                              ? 'bg-amber-500/5 border border-amber-500/20'
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
                                {t('clanDetail.level')} {req.user.level} · {req.user.xpPoints.toLocaleString()} XP
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
                        </div>
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
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation ═══ */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--error)]/15 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[var(--error)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('clanDetail.deleteConfirmTitle')}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{t('clanDetail.deleteConfirmDesc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(false)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--error)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                {saving ? t('common.deleting') : t('clanDetail.deleteClan')}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <MembersSection clan={clan} isLeader={isLeader} currentUserId={userId} onPromote={handlePromote} promoting={promoting} />
        </div>
      </div>
    </div>
  );
}
