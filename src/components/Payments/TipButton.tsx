'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Coins, Loader2, Check, X, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface TipButtonProps {
  chapterId: string;
  authorName: string;
  onTipSent?: () => void;
}

const PRESET_AMOUNTS = [10, 50, 100, 250, 500];

interface UserBalance {
  auraBalance: number;
}

export default function TipButton({ chapterId, authorName, onTipSent }: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const t = useT();
  const { handleError } = useErrorHandler();

  const fetchBalance = async () => {
     
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/economy/balance');
      if (response.ok) {
        const data: UserBalance = await response.json();
        setUserBalance(data.auraBalance);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (isOpen && userBalance === null && mounted) {
      queueMicrotask(() => { void fetchBalance(); });
    }
    return () => { mounted = false; };
  }, [isOpen]);

  const getAmount = (): number => {
    if (selectedAmount !== null) return selectedAmount;
    const custom = parseInt(customAmount, 10);
    return isNaN(custom) ? 0 : custom;
  };

  const validateTip = (): string | null => {
    const amount = getAmount();
    if (amount < 1) return t('tips.minAmount');
    if (userBalance !== null && amount > userBalance) return t('tips.insufficientBalance');
    return null;
  };

  const handleSendTip = async () => {
    const validationError = validateTip();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          amount: getAmount(),
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('tips.sendError'));
      }

      setIsSuccess(true);
      setUserBalance(data.newBalance);
      onTipSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tips.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setError(null);
    setSelectedAmount(100);
    setCustomAmount('');
    setMessage('');
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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ink"
        size="sm"
        className="flex items-center gap-2"
      >
        <Heart size={16} className="fill-current" />
        <span>{t('tips.sendTip')}</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[var(--border)] relative" role="dialog" aria-modal="true" aria-labelledby="tip-modal-title">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] transition-colors cursor-pointer"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>

        {!isSuccess ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] mb-4">
                <Heart size={28} className="fill-current" />
              </div>
              <h2 id="tip-modal-title" className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {t('tips.sendTip')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('tips.support')} <span className="font-semibold text-[var(--text-primary)]">{authorName}</span> con Aura
              </p>
            </div>

            <div className="bg-[var(--surface-sunken)] rounded-xl p-3 mb-6 flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{t('tips.yourBalance')}:</span>
              <div className="flex items-center gap-1 font-bold text-[var(--text-primary)]">
                <Coins size={16} className="text-[var(--warning)]" />
                {isLoadingBalance ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>{userBalance?.toLocaleString() || '0'} Aura</span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                {t('tips.selectAmount')}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePresetClick(amount)}
                    className={`
                      py-2 px-1 rounded-lg text-sm font-medium transition-all cursor-pointer
                      ${selectedAmount === amount
                        ? 'bg-[var(--accent-purple)] text-[var(--text-inverse)] shadow-md'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-[var(--border)]'
                      }
                    `}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="custom-tip-amount" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                {t('tips.customAmount')}
              </label>
              <div className="relative">
                <Coins
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--warning)]"
                  aria-hidden="true"
                />
                <Input
                  id="custom-tip-amount"
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder={t('tips.amountPlaceholder')}
                  className="pl-10 text-center font-mono"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="tip-message" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                <MessageSquare size={14} className="inline mr-1" aria-hidden="true" />
                {t('tips.optionalMessage')}
              </label>
              <textarea
                id="tip-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('tips.messagePlaceholder')}
                maxLength={200}
                className="w-full h-20 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                aria-describedby="tip-message-count"
              />
              <p id="tip-message-count" className="text-xs text-[var(--text-tertiary)] text-right mt-1">
                {message.length}/200
              </p>
            </div>

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

            <Button
              onClick={handleSendTip}
              disabled={isLoading || getAmount() < 1}
              isLoading={isLoading}
              className="w-full"
              variant="ink"
            >
              {isLoading ? (
                t('tips.sending')
              ) : (
                <>
                  <Heart size={18} className="mr-2 fill-current" />
                  {getAmount() > 0 ? `${getAmount().toLocaleString()} Aura` : t('tips.tip')}
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--success)]/20 text-[var(--success)] mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {t('tips.tipSent')}
            </h2>
            <p className="text-[var(--text-secondary)] mb-2">
              {t('tips.youSent')}{' '}
              <span className="font-bold text-[var(--accent-purple)]">
                {getAmount().toLocaleString()} Aura
              </span>{' '}
              a {authorName}
            </p>
            {message && (
              <p className="text-sm text-[var(--text-tertiary)] italic mb-4">
                &ldquo;{message}&rdquo;
              </p>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              {t('tips.newBalance')}: <span className="font-bold">{userBalance?.toLocaleString()} Aura</span>
            </p>
            <Button
              onClick={handleClose}
              className="mt-6"
              variant="secondary"
            >
              {t('common.close')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
