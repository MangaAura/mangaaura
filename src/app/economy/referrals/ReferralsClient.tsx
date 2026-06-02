'use client';

import { Users, Copy, CheckCircle, Clock, Gift, Share2, MessageCircle, Globe, Send, Flag } from 'lucide-react';
import { useState } from 'react';

import { setOnboardingMarker } from '@/components/Onboarding';
import { useT } from '@/i18n';

interface RefereeUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
}

interface ReferralItem {
  refereeId: string;
  status: string;
  purchaseAmount: number;
  bonusAwarded: number;
  createdAt: string;
  unlockedAt: string | null;
  claimedAt: string | null;
  referee: RefereeUser | null;
}

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  locked: number;
  unlocked: number;
  claimed: number;
  totalEarnedFromReferrals: number;
  pendingBonus: number;
  canClaim: boolean;
  referrals: ReferralItem[];
}

const MILESTONES = [
  { count: 3, badgeId: 'REFERRAL_RECRUITER' },
  { count: 10, badgeId: 'REFERRAL_INFLUENCER' },
  { count: 25, badgeId: 'REFERRAL_VIRAL' },
  { count: 50, badgeId: 'REFERRAL_LEGEND' },
];

const BADGE_CONFIG: Record<string, { icon: string; i18nKey: string }> = {
  REFERRAL_RECRUITER: { icon: '🎯', i18nKey: 'RECRUITER' },
  REFERRAL_INFLUENCER: { icon: '🌟', i18nKey: 'INFLUENCER' },
  REFERRAL_VIRAL: { icon: '🔥', i18nKey: 'VIRAL' },
  REFERRAL_LEGEND: { icon: '👑', i18nKey: 'LEGEND' },
};

export function ReferralsClient({ stats }: { stats: ReferralStats }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${stats.referralCode}`
    : '';

  async function copyCode() {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setOnboardingMarker('mangaaura-has-referred');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShareLink(platform: string) {
    shareLink(platform);
    setOnboardingMarker('mangaaura-has-referred');
  }

  async function shareLink(platform: string) {
    const text = `¡Únete a MangaAura con mi código y gana Aura! 🎉 ${referralLink}`;
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('¡Únete a MangaAura! 🎉')}`;
        break;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function claimBonus(refereeId: string) {
    setClaimingId(refereeId);
    setMessage(null);

    try {
      const res = await fetch('/api/economy/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refereeId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al reclamar' });
      } else {
        setMessage({ type: 'success', text: `¡Bono reclamado! +${data.bonusAmount} Aura` });
        window.location.reload();
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setClaimingId(null);
    }
  }

  const currentMilestone = MILESTONES.find((m) => stats.totalReferrals < m.count) || MILESTONES[MILESTONES.length - 1];
  const nextTarget = currentMilestone.count;
  const prevTarget = MILESTONES.find((m) => m.count === currentMilestone.count)
    ? (MILESTONES[MILESTONES.indexOf(currentMilestone) - 1]?.count || 0)
    : 0;
  const progressInMilestone = stats.totalReferrals - prevTarget;
  const milestoneRange = nextTarget - prevTarget;
  const progressPercent = milestoneRange > 0 ? Math.min(100, Math.round((progressInMilestone / milestoneRange) * 100)) : 100;

  if (!stats.referralCode) {
    return (
      <div className="text-center py-12 text-muted">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Users className="text-purple-500" size={20} />
          <span className="text-sm font-medium text-purple-500">{t('economy.referral.yourCode')}</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-2xl font-bold tracking-wider">{stats.referralCode}</code>
          <button
            onClick={copyCode}
            className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          >
            {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p className="text-sm text-muted mt-2">
          {t('economy.referral.earn')}
        </p>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-muted mr-1">{t('economy.referral.socialShare.title')}</span>
          <button
            onClick={() => handleShareLink('whatsapp')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-500 text-xs font-medium hover:bg-green-500/30 transition-colors"
          >
            <MessageCircle size={14} /> {t('economy.referral.socialShare.whatsapp')}
          </button>
          <button
            onClick={() => handleShareLink('twitter')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-400/20 text-blue-400 text-xs font-medium hover:bg-blue-400/30 transition-colors"
          >
            <Globe size={14} /> {t('economy.referral.socialShare.twitter')}
          </button>
          <button
            onClick={() => handleShareLink('telegram')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-500 text-xs font-medium hover:bg-blue-500/30 transition-colors"
          >
            <Send size={14} /> {t('economy.referral.socialShare.telegram')}
          </button>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--muted)] text-xs font-medium hover:bg-[var(--border)] transition-colors"
          >
            <Share2 size={14} /> {t('economy.referral.socialShare.copyLink')}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Flag className="text-amber-500" size={18} />
          <span className="text-sm font-semibold">{t('economy.referral.milestones.title')}</span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{t('economy.referral.milestones.progress', { current: stats.totalReferrals, target: nextTarget })}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-amber-500/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          {MILESTONES.map((m) => {
            const reached = stats.totalReferrals >= m.count;
            const cfg = BADGE_CONFIG[m.badgeId];
            return (
              <div
                key={m.badgeId}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
                  reached
                    ? 'bg-green-500/20 border-green-500/40 text-green-500'
                    : 'bg-[var(--muted)] border-[var(--border)] text-muted'
                }`}
              >
                <span>{cfg?.icon}</span>
                <span>{cfg ? t(`economy.referral.milestones.badges.${cfg.i18nKey}` as const) : m.badgeId}</span>
                <span className="opacity-60">({m.count})</span>
                {reached && <CheckCircle size={12} className="shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Total referidos</p>
          <p className="text-2xl font-bold">{stats.totalReferrals}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">{t('economy.referral.earnLabel')}</p>
          <p className="text-2xl font-bold text-purple-500">{stats.totalEarnedFromReferrals}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">{t('economy.referral.pending')}</p>
          <p className="text-2xl font-bold">{stats.unlocked}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">{t('economy.referral.claimed')}</p>
          <p className="text-2xl font-bold text-green-500">{stats.claimed}</p>
        </div>
      </div>

      {stats.pendingBonus > 0 && stats.canClaim && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="text-green-500" size={20} />
            <span className="font-medium">{t('economy.referral.pendingBonus')}: {stats.pendingBonus} Aura</span>
          </div>
        </div>
      )}

      {!stats.canClaim && stats.unlocked > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm">
            {t('economy.referral.error.needPurchase')}
          </p>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Referidos</h2>
        {stats.referrals.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Users size={40} className="mx-auto mb-2 opacity-50" />
            <p>{t('economy.referral.noReferrals')}</p>
            <p className="text-sm">{t('economy.referral.noReferralsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.referrals.map((ref) => {
              const displayName = ref.referee?.displayName || ref.referee?.username || `Usuario ${ref.refereeId.slice(0, 8)}...`;
              return (
                <div
                  key={ref.refereeId}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3">
                    {ref.referee?.avatarUrl ? (
                      <img
                        src={ref.referee.avatarUrl}
                        alt={displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-500">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {ref.status === 'claimed' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : ref.status === 'unlocked' ? (
                      <Clock className="text-amber-500" size={20} />
                    ) : (
                      <Clock className="text-muted" size={20} />
                    )}
                    <div>
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted">
                        {ref.referee && <span className="mr-2">Lvl {ref.referee.level}</span>}
                        {ref.status === 'locked' && 'Sin compra aún'}
                        {ref.status === 'unlocked' && `Compra: ${ref.purchaseAmount} Aura (+${ref.bonusAwarded} bonus)`}
                        {ref.status === 'claimed' && `Reclamado: +${ref.bonusAwarded} Aura`}
                      </p>
                    </div>
                  </div>
                  {ref.status === 'unlocked' && stats.canClaim && (
                    <button
                      onClick={() => claimBonus(ref.refereeId)}
                      disabled={claimingId === ref.refereeId}
                      className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {claimingId === ref.refereeId ? '...' : t('economy.referral.claim')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}