'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Coins, Loader2, Check, X, Eye, EyeOff, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { cn } from '@/lib/utils';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle?: string;
  currentAmount: number;
  goalAmount: number;
  percentage: number;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

interface UserBalance {
  balance: number;
}

export default function ContributionModal({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  currentAmount,
  goalAmount,
  percentage,
  onSuccess,
}: ContributionModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { handleError } = useErrorHandler();
  const [result, setResult] = useState<{ newTotal: number; goalReached: boolean } | null>(null);

  const fetchBalance = async () => {
     
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/economy/balance');
      if (response.ok) {
        const data: UserBalance = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Load user balance when modal opens
  useEffect(() => {
    let mounted = true;
    if (isOpen && userBalance === null && mounted) {
      fetchBalance();
    }
    return () => { mounted = false; };
  }, [isOpen]);

  const getAmount = (): number => {
    if (selectedAmount !== null) return selectedAmount;
    const custom = parseInt(customAmount, 10);
    return isNaN(custom) ? 0 : custom;
  };

  const validateContribution = (): string | null => {
    const amount = getAmount();
    if (amount < 1) return 'El monto mínimo es 1 Aura';
    if (userBalance !== null && amount > userBalance) return 'Saldo insuficiente';
    return null;
  };

  const handleContribute = async () => {
    const validationError = validateContribution();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crowdfunding/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          amount: getAmount(),
          isAnonymous,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al realizar contribución');
      }

      setResult({
        newTotal: data.newTotal,
        goalReached: data.goalReached,
      });
      setUserBalance((prev) => (prev !== null ? prev - getAmount() : null));
      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al realizar contribución');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSuccess(false);
      setError(null);
      setSelectedAmount(100);
      setCustomAmount('');
      setMessage('');
      setIsAnonymous(false);
      setResult(null);
    }, 200);
  };

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setSelectedAmount(null);
    setError(null);
  };

  const remaining = Math.max(goalAmount - currentAmount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[var(--border)] relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mb-4">
                <Crown size={28} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Contribuir al Crowdfunding
              </h2>
              {chapterTitle && (
<p className="text-sm text-[var(--text-secondary)]">
              {chapterTitle}
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="bg-[var(--surface-sunken)] rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-muted)] flex items-center gap-1">
                  <Target size={14} />
                  Progreso
                </span>
<span className="font-bold text-[var(--primary)]">
              {percentage}%
            </span>
              </div>
              <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] transition-all"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>{currentAmount.toLocaleString()} IC recaudados</span>
                <span>{remaining.toLocaleString()} IC restantes</span>
              </div>
            </div>

            {/* Balance Display */}
            <div className="bg-[var(--surface-sunken)] rounded-xl p-3 mb-6 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Tu saldo:</span>
              <div className="flex items-center gap-1 font-bold text-[var(--text-primary)]">
                <Coins size={16} className="text-[var(--warning)]" />
                {isLoadingBalance ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>{userBalance?.toLocaleString() || '0'} IC</span>
                )}
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                Selecciona un monto
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePresetClick(amount)}
          className={`
            py-2 px-1 rounded-lg text-sm font-medium transition-all cursor-pointer
            ${selectedAmount === amount
              ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-md'
              : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }
          `}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
<label htmlFor="contribution-amount" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            O ingresa un monto personalizado
              </label>
              <div className="relative">
                <Coins
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--warning)]"
                  aria-hidden="true"
                />
                <Input
                  id="contribution-amount"
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Monto personalizado"
                  className="pl-10 text-center font-mono"
                />
              </div>
            </div>

            {/* Anonymous Checkbox */}
            <div className="mb-4">
              <label htmlFor="contribution-anonymous" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="contribution-anonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                  isAnonymous ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface-sunken)]'
                )}>
                  {isAnonymous && <Check size={14} className="text-[var(--text-inverse)]" aria-hidden="true" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span aria-hidden="true">{isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                  <span>Contribución anónima</span>
                </div>
              </label>
            </div>

            {/* Message */}
            <div className="mb-6">
      <label htmlFor="contribution-message" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            Mensaje para el autor (opcional)
              </label>
              <textarea
                id="contribution-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje de apoyo..."
                maxLength={500}
                className="w-full h-20 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                aria-describedby="contribution-message-count"
              />
              <p id="contribution-message-count" className="text-xs text-[var(--text-tertiary)] text-right mt-1">
                {message.length}/500
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ErrorMessage
                    message={error}
                    onDismiss={() => setError(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              onClick={handleContribute}
              disabled={isLoading || getAmount() < 1}
              isLoading={isLoading}
              className="w-full"
              variant="ink"
            >
              {isLoading ? (
                'Procesando...'
              ) : (
                <>
                  <Crown size={18} className="mr-2" />
                  Contribuir {getAmount() > 0 ? `${getAmount().toLocaleString()} IC` : ''}
                </>
              )}
            </Button>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--success)]/20 text-[var(--success)] mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              ¡Contribución Exitosa!
            </h2>
            <p className="text-[var(--text-muted)] mb-2">
              Has contribuido{' '}
              <span className="font-bold text-[var(--primary)]">
                {getAmount().toLocaleString()} Aura
              </span>
            </p>
            {message && !isAnonymous && (
              <p className="text-sm text-[var(--text-tertiary)] italic mb-4">
                &ldquo;{message}&rdquo;
              </p>
            )}
            {result?.goalReached && (
<div className="mb-4 p-3 bg-[var(--success)]/10 rounded-lg">
        <p className="text-sm font-bold text-[var(--success)]">
                  ¡Meta alcanzada! 🎉
                </p>
              </div>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              Total recaudado:{' '}
              <span className="font-bold">{result?.newTotal.toLocaleString()} IC</span>
            </p>
            <Button
              onClick={handleClose}
              className="mt-6"
              variant="secondary"
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
