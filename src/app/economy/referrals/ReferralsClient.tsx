'use client';

import { useState } from 'react';
import { Users, Copy, CheckCircle, Clock, Gift } from 'lucide-react';

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  locked: number;
  unlocked: number;
  claimed: number;
  totalEarnedFromReferrals: number;
  pendingBonus: number;
  canClaim: boolean;
  referrals: Array<{
    refereeId: string;
    status: string;
    purchaseAmount: number;
    bonusAwarded: number;
    createdAt: string;
    unlockedAt: string | null;
    claimedAt: string | null;
  }>;
}

export function ReferralsClient({ stats }: { stats: ReferralStats }) {
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
      setTimeout(() => setCopied(false), 2000);
    }
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
          <span className="text-sm font-medium text-purple-500">Tu código de referido</span>
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
          Comparte tu código con amigos. Ganas 10% de su primera compra de Aura.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Total referidos</p>
          <p className="text-2xl font-bold">{stats.totalReferrals}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Ganado total</p>
          <p className="text-2xl font-bold text-purple-500">{stats.totalEarnedFromReferrals}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Pendientes</p>
          <p className="text-2xl font-bold">{stats.unlocked}</p>
        </div>
        <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Reclamados</p>
          <p className="text-2xl font-bold text-green-500">{stats.claimed}</p>
        </div>
      </div>

      {stats.pendingBonus > 0 && stats.canClaim && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="text-green-500" size={20} />
            <span className="font-medium">Tienes {stats.pendingBonus} Aura pendientes de reclamar</span>
          </div>
        </div>
      )}

      {!stats.canClaim && stats.unlocked > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm">
            Haz una compra para reclamar los bonuses de tus referidos que ya desbloquearon.
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
            <p>No tienes referidos aún</p>
            <p className="text-sm">Comparte tu código para empezar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.referrals.map((ref) => (
              <div
                key={ref.refereeId}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  {ref.status === 'claimed' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : ref.status === 'unlocked' ? (
                    <Clock className="text-amber-500" size={20} />
                  ) : (
                    <Clock className="text-muted" size={20} />
                  )}
                  <div>
                    <p className="text-sm font-medium">Usuario {ref.refereeId.slice(0, 8)}...</p>
                    <p className="text-xs text-muted">
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
                    {claimingId === ref.refereeId ? '...' : 'Reclamar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}