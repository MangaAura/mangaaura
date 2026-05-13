'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Crown, Loader2, Coins, Target, Check } from 'lucide-react';

interface SponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  chapterId: string;
}

interface CrowdfundData {
  goal: number;
  current: number;
  topSponsors: Array<{ username: string; amount: number }>;
}

export default function SponsorshipModal({ isOpen, onClose, chapterTitle, chapterId }: SponsorshipModalProps) {
  const { data: session } = useSession();
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [crowdfund, setCrowdfund] = useState<CrowdfundData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen || !chapterId) return;
    setLoadingData(true);
    fetch(`/api/chapters/${chapterId}/crowdfund`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setCrowdfund({
            goal: data.goal || 10000,
            current: data.current || 0,
            topSponsors: data.topSponsors || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [isOpen, chapterId]);

  if (!isOpen) return null;

  const currentGoal = crowdfund?.goal || 10000;
  const currentRaised = crowdfund?.current || 0;
  const percentage = Math.min((currentRaised / currentGoal) * 100, 100);

  const handleSponsor = async () => {
    if (!bidAmount || bidAmount <= 0 || !session?.user?.id) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/gamification/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          bidAmount: Number(bidAmount)
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error en la transacción');
      }

      setIsSuccess(true);
    } catch (error: any) {
      alert(error.message || "Error en la transacción.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-secondary w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-custom relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-tertiary text-muted transition-colors cursor-pointer" aria-label="Cerrar">
          <X size={20} />
        </button>

        {!isSuccess ? (
          <>
            <div className="text-center mb-6 pt-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] mb-4 border border-[var(--warning)]/20">
                <Crown size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Patrocinar Próximo Capítulo</h2>
              <p className="text-sm text-muted px-4">
                Apoya directamente al creador de <strong>{chapterTitle}</strong> con tus InkCoins para desbloquear el próximo capítulo más rápido.
              </p>
            </div>

            <div className="bg-tertiary rounded-xl p-5 mb-6 border border-custom">
              {loadingData ? (
                <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-muted" /></div>
              ) : (
                <>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="flex items-center gap-1 text-accent-blue"><Target size={16}/> Meta de Crowdfunding</span>
                    <span>{currentRaised.toLocaleString()} / {currentGoal.toLocaleString()} IC</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden border border-custom mb-3">
                    <div className="bg-gradient-to-r from-accent-blue to-accent-purple h-full transition-all" style={{ width: `${percentage}%` }}></div>
                  </div>

                  {crowdfund?.topSponsors && crowdfund.topSponsors.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-custom">
                      <h4 className="text-xs font-bold text-muted uppercase mb-2">Top Mecenas Actuales</h4>
                      {crowdfund.topSponsors.slice(0, 3).map((s, i) => (
                        <div key={s.username || `sponsor-${i}`} className="flex justify-between items-center text-sm mb-1">
                          <span className="font-semibold flex items-center gap-2">
                            <span className={i === 0 ? 'text-[var(--warning)]' : i === 1 ? 'text-[var(--text-muted)]' : 'text-[var(--accent-orange)]'}>{i + 1}.</span>
                            {s.username}
                          </span>
                          <span className="font-mono text-xs">{s.amount.toLocaleString()} IC</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tu Aportación (InkCoins)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--warning)]">
                    <Coins size={18} />
                  </div>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    placeholder="Ej: 500"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-custom focus:border-[var(--warning)] focus:ring-1 focus:ring-[var(--warning)] rounded-xl outline-none font-mono font-bold transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSponsor}
                disabled={!bidAmount || bidAmount <= 0 || isLoading || !session?.user?.id}
                className="w-full bg-gradient-to-r from-[var(--warning)] to-[var(--warning)] hover:brightness-110 text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Crown size={18} /> Donar InkCoins</>}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-green/10 text-accent-green mb-6 border-2 border-accent-green/20">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-3">¡Gracias por tu apoyo!</h2>
            <p className="text-muted mb-8">
              Has aportado <strong>{bidAmount} InkCoins</strong> al capítulo. El creador ha sido notificado.
            </p>
            <button
              onClick={() => { setIsSuccess(false); setBidAmount(''); onClose(); }}
              className="px-8 py-3 bg-tertiary hover:bg-secondary border border-custom font-bold rounded-xl transition-colors cursor-pointer"
            >
              Volver a la lectura
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
