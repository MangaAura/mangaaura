'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Loader2, Coins, Target, Check, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import FocusLock from 'react-focus-lock';

import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface SponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  chapterId: string;
}

interface SponsorData {
  currentWinner: {
    bidAmount: number;
    sponsorName: string;
    message: string | null;
    username: string;
  } | null;
  bids: Array<{ bidAmount: number; username: string; status: string }>;
  minNextBid: number;
  bidCount: number;
}

export default function SponsorshipModal({ isOpen, onClose, chapterTitle, chapterId }: SponsorshipModalProps) {
  const { data: session } = useSession();
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [bidAmountTouched, setBidAmountTouched] = useState(false);
  const [bidAmountError, setBidAmountError] = useState('');
  const [bidAmountValid, setBidAmountValid] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const [titleId] = useState(() => `sponsor-title-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!isOpen || !chapterId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingData(true);
    setDataError('');
    fetch(`/api/chapters/${chapterId}/sponsor`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setSponsorData(data);
          setBidAmount(data.minNextBid || '');
        }
      })
      .catch(() => {
        setDataError('No se pudo cargar la información de patrocinio.');
      })
      .finally(() => setLoadingData(false));
  }, [isOpen, chapterId]);

  useEffect(() => {
    if (isOpen) {
      const trigger = document.activeElement as HTMLElement;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        trigger?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minBid = sponsorData?.minNextBid || 10;
  const currentWinner = sponsorData?.currentWinner;

  const validateBidAmount = (value: number | '') => {
    const numValue = Number(value);
    if (value === '' || numValue <= 0) {
      setBidAmountError('Enter a valid amount');
      setBidAmountValid(false);
    } else if (numValue < minBid) {
      setBidAmountError(`Minimum bid is ${minBid} IC`);
      setBidAmountValid(false);
    } else {
      setBidAmountError('');
      setBidAmountValid(true);
    }
  };

  const handleSponsor = async () => {
    if (!bidAmount || bidAmount <= 0 || !session?.user?.id) return;
    setSubmitError('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/chapters/${chapterId}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidAmount: Number(bidAmount),
          sponsorName: sponsorName || undefined,
          message: message || undefined,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en la transacción');
      }

      setIsSuccess(true);
} catch (error: any) {
        setSubmitError(error.message || 'Error en la transacción.');
      } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <FocusLock returnFocus>
        <div className="bg-secondary w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-custom relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-tertiary text-muted transition-colors cursor-pointer" aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>

        {!isSuccess ? (
          <>
            <div className="text-center mb-6 pt-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] mb-4 border border-[var(--warning)]/20">
                <Crown size={28} aria-hidden="true" />
              </div>
              <h2 id={titleId} className="text-2xl font-bold mb-2">Patrocinar Próximo Capítulo</h2>
              <p className="text-sm text-muted px-4">
                Apoya directamente al creador de <strong>{chapterTitle}</strong> con tus Aura para desbloquear el próximo capítulo más rápido.
              </p>
            </div>

            <div className="bg-tertiary rounded-xl p-5 mb-6 border border-custom">
              {loadingData ? (
                <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-muted" /></div>
              ) : dataError ? (
                <ErrorMessage
                  message={dataError}
                  onDismiss={() => setDataError('')}
                />
              ) : (
                <>
                  {currentWinner ? (
                    <div className="text-center mb-4">
                      <p className="text-xs text-muted uppercase font-bold mb-2">Patrocinador Actual</p>
                      <p className="text-lg font-bold text-[var(--warning)]">{currentWinner.sponsorName}</p>
                      <p className="text-sm font-mono">{currentWinner.bidAmount.toLocaleString()} IC</p>
                      {currentWinner.message && (
                        <p className="text-xs text-muted italic mt-2">"{currentWinner.message}"</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <Target size={24} className="mx-auto text-muted mb-2" aria-hidden="true" />
                      <p className="text-sm text-muted">Sé el primer patrocinador de este capítulo</p>
                    </div>
                  )}
                  <div className="border-t border-custom pt-3 mt-3">
                    <div className="flex justify-between text-xs text-muted font-semibold mb-2">
                      <span>Puja mínima</span>
                      <span className="font-mono">{minBid.toLocaleString()} IC</span>
                    </div>
                    {sponsorData && sponsorData.bids.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {sponsorData.bids.filter(b => b.status === 'ACTIVE' || b.status === 'LOST').slice(0, 5).map((b, i) => (
                          <div key={`bid-${i}`} className="flex justify-between items-center text-xs py-1">
                            <span className="font-semibold">{b.username}</span>
                            <span className="font-mono">{b.bidAmount.toLocaleString()} IC</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="sponsor-amount" className="block text-sm font-semibold mb-2">Tu Puja (Aura)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--warning)]">
                    <Coins size={18} aria-hidden="true" />
                  </div>
                  <input
                    id="sponsor-amount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setBidAmount(val);
                      setSubmitError('');
                      if (bidAmountTouched) validateBidAmount(val);
                    }}
                    onBlur={() => {
                      setBidAmountTouched(true);
                      validateBidAmount(bidAmount);
                    }}
                    placeholder={`Mín: ${minBid}`}
                    min={minBid}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-custom focus:border-[var(--warning)] focus:ring-1 focus:ring-[var(--warning)] rounded-xl outline-none font-mono font-bold transition-all"
                  />
                  {bidAmountTouched && (
                    <AnimatePresence>
                      {bidAmountError ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                        >
                          <ErrorMessage
                            message={bidAmountError}
                            severity="warning"
                          />
                        </motion.div>
                      ) : bidAmountValid && bidAmount !== '' ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                          <p className="text-xs text-[var(--success)]">Valid amount</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="sponsor-name" className="block text-sm font-semibold mb-2">Nombre Visible (opcional)</label>
                <input
                  id="sponsor-name"
                  type="text"
                  value={sponsorName}
                  onChange={(e) => { setSponsorName(e.target.value); setSubmitError(''); }}
                  placeholder="Tu nombre del patrocinio"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-background border border-custom focus:border-[var(--warning)] focus:ring-1 focus:ring-[var(--warning)] rounded-xl outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="sponsor-message" className="block text-sm font-semibold mb-2">Mensaje (opcional)</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-muted">
                    <MessageSquare size={16} aria-hidden="true" />
                  </div>
                  <textarea
                    id="sponsor-message"
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setSubmitError(''); }}
                    placeholder="Deja un mensaje al creador..."
                    maxLength={100}
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-custom focus:border-[var(--warning)] focus:ring-1 focus:ring-[var(--warning)] rounded-xl outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {submitError && (
                <ErrorMessage
                  message={submitError}
                  onDismiss={() => setSubmitError('')}
                />
              )}

              <button
                onClick={handleSponsor}
                disabled={!bidAmount || Number(bidAmount) < minBid || isLoading || !session?.user?.id}
                className="w-full bg-gradient-to-r from-[var(--warning)] to-[var(--warning)] hover:brightness-110 text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Crown size={18} /> Patrocinar</>}
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
              Has aportado <strong>{bidAmount} Aura</strong> al capítulo. El creador ha sido notificado.
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
      </FocusLock>
    </div>
  );
}
