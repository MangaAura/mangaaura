'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface BalanceInfo {
  auraBalance: number;
  auraLifetimePurchased: number;
  transferQuotaAvailable: number;
  canTransfer: boolean;
}

interface TransferResult {
  success: boolean;
  transferId: string;
  burnedAmount: number;
  netAmount: number;
  newBalance: number;
  transferQuotaRemaining: number;
}

export function TransferClient({ balanceInfo }: { balanceInfo: BalanceInfo | null }) {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!balanceInfo) {
    return (
      <div className="text-center py-12 text-muted">
        Inicia sesión para transferir Aura
      </div>
    );
  }

  const burnedAmount = Math.floor(amount * 0.03);
  const netAmount = amount - burnedAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/economy/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: recipientId, amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al transferir');
      } else {
        setResult(data);
        setRecipientId('');
        setAmount(0);
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Tu saldo</p>
          <p className="text-2xl font-bold">{balanceInfo.auraBalance.toLocaleString()} Aura</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
          <p className="text-sm text-muted">Límite disponible</p>
          <p className="text-2xl font-bold">{balanceInfo.transferQuotaAvailable.toLocaleString()} Aura</p>
          <p className="text-xs text-muted">Solo Aura purchased</p>
        </div>
      </div>

      {!balanceInfo.canTransfer && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="text-amber-500 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium">Primero debes comprar Aura</p>
            <p className="text-muted">Solo el Aura purchased puede transferirse fuera. Las compras se desbloquean a partir de 500 Aura.</p>
          </div>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <CheckCircle className="text-green-500 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium">¡Transferencia exitosa!</p>
            <p className="text-muted">
              Enviaste {amount} Aura (-{burnedAmount} comisión). Recibieron {netAmount} Aura.
            </p>
            <p className="text-muted">Nuevo saldo: {result.newBalance.toLocaleString()} Aura</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ID del destinatario</label>
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="UUID del usuario"
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cantidad a enviar</label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            placeholder="0"
            min={1}
            max={balanceInfo.transferQuotaAvailable}
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {amount > 0 && (
          <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Envías</span>
              <span>{amount.toLocaleString()} Aura</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Comisión (3%)</span>
              <span>-{burnedAmount.toLocaleString()} Aura</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between font-medium">
              <span>Reciben</span>
              <span className="text-[var(--primary)]">{netAmount.toLocaleString()} Aura</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !balanceInfo.canTransfer || amount <= 0 || amount > balanceInfo.transferQuotaAvailable}
          className="w-full py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Aura'}
        </button>
      </form>
    </div>
  );
}