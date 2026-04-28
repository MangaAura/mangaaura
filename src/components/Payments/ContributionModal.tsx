'use client';

import React, { useState, useEffect } from 'react';
import { Crown, Coins, Loader2, Check, X, Eye, EyeOff, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
  const [result, setResult] = useState<{ newTotal: number; goalReached: boolean } | null>(null);

  // Load user balance when modal opens
  useEffect(() => {
    if (isOpen && userBalance === null) {
      fetchBalance();
    }
  }, [isOpen]);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/economy/balance');
      if (response.ok) {
        const data: UserBalance = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getAmount = (): number => {
    if (selectedAmount !== null) return selectedAmount;
    const custom = parseInt(customAmount, 10);
    return isNaN(custom) ? 0 : custom;
  };

  const validateContribution = (): string | null => {
    const amount = getAmount();
    if (amount < 1) return 'El monto mínimo es 1 InkCoin';
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <X size={20} />
        </button>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
                <Crown size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                Contribuir al Crowdfunding
              </h2>
              {chapterTitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {chapterTitle}
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Target size={14} />
                  Progreso
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{currentAmount.toLocaleString()} IC recaudados</span>
                <span>{remaining.toLocaleString()} IC restantes</span>
              </div>
            </div>

            {/* Balance Display */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 mb-6 flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Tu saldo:</span>
              <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                <Coins size={16} className="text-yellow-500" />
                {isLoadingBalance ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>{userBalance?.toLocaleString() || '0'} IC</span>
                )}
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Selecciona un monto
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePresetClick(amount)}
                    className={`
                      py-2 px-1 rounded-lg text-sm font-medium transition-all
                      ${selectedAmount === amount
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                O ingresa un monto personalizado
              </label>
              <div className="relative">
                <Coins
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500"
                />
                <Input
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
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${isAnonymous
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }
                  `}
                >
                  {isAnonymous && <Check size={14} className="text-white" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>Contribución anónima</span>
                </div>
              </label>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Mensaje para el autor (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje de apoyo..."
                maxLength={500}
                className="w-full h-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500 text-right mt-1">
                {message.length}/500
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              ¡Contribución Exitosa!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Has contribuido{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {getAmount().toLocaleString()} InkCoins
              </span>
            </p>
            {message && !isAnonymous && (
              <p className="text-sm text-slate-500 dark:text-slate-500 italic mb-4">
                &ldquo;{message}&rdquo;
              </p>
            )}
            {result?.goalReached && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  ¡Meta alcanzada! 🎉
                </p>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
