'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Coins, Loader2, Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface TipButtonProps {
  chapterId: string;
  authorName: string;
  authorId: string;
  onTipSent?: () => void;
}

const PRESET_AMOUNTS = [10, 50, 100, 250, 500];

interface UserBalance {
  balance: number;
}

export default function TipButton({ chapterId, authorName, authorId, onTipSent }: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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

  const validateTip = (): string | null => {
    const amount = getAmount();
    if (amount < 1) return 'El monto mínimo es 1 InkCoin';
    if (userBalance !== null && amount > userBalance) return 'Saldo insuficiente';
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
        throw new Error(data.error || 'Error al enviar propina');
      }

      setIsSuccess(true);
      setUserBalance(data.newBalance);
      onTipSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar propina');
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
    // Only allow numbers
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
        <span>Enviar Propina</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 relative">
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
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-pink-500/10 text-pink-500 mb-4">
                <Heart size={28} className="fill-current" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                Enviar Propina
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Apoya a <span className="font-semibold text-slate-700 dark:text-slate-300">{authorName}</span> con InkCoins
              </p>
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
                        ? 'bg-pink-500 text-white shadow-md'
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

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <MessageSquare size={14} className="inline mr-1" />
                Mensaje opcional
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje de apoyo..."
                maxLength={200}
                className="w-full h-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500 text-right mt-1">
                {message.length}/200
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
              onClick={handleSendTip}
              disabled={isLoading || getAmount() < 1}
              isLoading={isLoading}
              className="w-full"
              variant="ink"
            >
              {isLoading ? (
                'Enviando...'
              ) : (
                <>
                  <Heart size={18} className="mr-2 fill-current" />
                  Enviar {getAmount() > 0 ? `${getAmount().toLocaleString()} IC` : 'Propina'}
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
              ¡Propina Enviada!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Has enviado{' '}
              <span className="font-bold text-pink-500">
                {getAmount().toLocaleString()} InkCoins
              </span>{' '}
              a {authorName}
            </p>
            {message && (
              <p className="text-sm text-slate-500 dark:text-slate-500 italic mb-4">
                &ldquo;{message}&rdquo;
              </p>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nuevo saldo: <span className="font-bold">{userBalance?.toLocaleString()} IC</span>
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
