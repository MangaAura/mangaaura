'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';

interface WithdrawInfo {
  auraBalance: number;
  auraFirstPurchaseAt: string | null;
  kycStatus: string;
  canWithdraw: boolean;
}

interface WithdrawResult {
  success: boolean;
  withdrawalId: string;
  amount: number;
  fee: number;
  netToUser: number;
  newBalance: number;
}

export function WithdrawClient({ withdrawInfo }: { withdrawInfo: WithdrawInfo | null }) {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startingKyc, setStartingKyc] = useState(false);

  if (!withdrawInfo) {
    return (
      <div className="text-center py-12 text-muted">
        Inicia sesión para retirar Aura
      </div>
    );
  }

  const { auraBalance, auraFirstPurchaseAt, kycStatus, canWithdraw } = withdrawInfo;
  const MIN_WITHDRAW = 1000;
  const fee = Math.floor(amount * 0.30);
  const netToUser = amount - fee;

  const daysSincePurchase = auraFirstPurchaseAt
    ? Math.floor((Date.now() - new Date(auraFirstPurchaseAt).getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const daysUntilWithdraw = daysSincePurchase !== null && daysSincePurchase < 30
    ? 30 - daysSincePurchase
    : 0;

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/economy/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar retiro');
      } else {
        setResult(data);
        setAmount(0);
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  async function startKyc() {
    setStartingKyc(true);
    try {
      const res = await fetch('/api/economy/kyc/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch {
      setError('Error al iniciar verificación');
    } finally {
      setStartingKyc(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
        <p className="text-sm text-muted">Tu saldo</p>
        <p className="text-2xl font-bold">{auraBalance.toLocaleString()} Aura</p>
        <p className="text-xs text-muted">≈ {(auraBalance / 100).toFixed(2)} €</p>
      </div>

      {kycStatus === 'none' && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <Shield className="text-amber-500 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium">Verificación de identidad requerida</p>
              <p className="text-sm text-muted mt-1">
                Para retirar dinero real a tu cuenta bancaria, necesitamos verificar tu identidad.
              </p>
              <button
                onClick={startKyc}
                disabled={startingKyc}
                className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {startingKyc ? 'Iniciando...' : 'Verificar identidad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-2">
            <Clock className="text-blue-500 mt-0.5" size={20} />
            <div>
              <p className="font-medium">Verificación en proceso</p>
              <p className="text-sm text-muted">
                Tu identidad está siendo verificada. Podrás retirar una vez aprobado.
              </p>
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <p className="font-medium">Verificación rechazada</p>
              <p className="text-sm text-muted">
                Tu verificación fue rechazada. Por favor intenta de nuevo.
              </p>
              <button
                onClick={startKyc}
                className="mt-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Reintentar verificación
              </button>
            </div>
          </div>
        </div>
      )}

      {daysUntilWithdraw > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-amber-500 mt-0.5" size={20} />
            <div>
              <p className="font-medium">Período de espera</p>
              <p className="text-sm text-muted">
                Debes esperar 30 días desde tu primera compra para retirar.
                Faltan {daysUntilWithdraw} días.
              </p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-500 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-medium">¡Retiro procesado!</p>
              <p className="text-muted">
                Amount: {result.amount} Aura | Comisión: {result.fee} Aura | Net: {result.netToUser} Aura
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      )}

      {canWithdraw && kycStatus === 'approved' && daysUntilWithdraw === 0 && (
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad a retirar</label>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              placeholder="0"
              min={MIN_WITHDRAW}
              max={auraBalance}
              required
              className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none"
            />
            <p className="text-xs text-muted mt-1">Mínimo: {MIN_WITHDRAW} Aura</p>
          </div>

          {amount > 0 && (
            <div className="p-4 rounded-lg bg-[var(--muted)] border border-[var(--border)] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Cantidad</span>
                <span>{amount.toLocaleString()} Aura</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Comisión (30%)</span>
                <span>-{fee.toLocaleString()} Aura</span>
              </div>
              <div className="border-t border-[var(--border)] pt-2 flex justify-between font-medium">
                <span>Recibirás</span>
                <span className="text-green-500">{netToUser.toLocaleString()} Aura</span>
              </div>
              <p className="text-xs text-muted">
                ≈ {(netToUser / 100).toFixed(2)} € (según tipo de cambio actual)
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || amount < MIN_WITHDRAW || amount > auraBalance}
            className="w-full py-3 px-4 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Retirar a banco'}
          </button>
        </form>
      )}
    </div>
  );
}

function Clock({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}