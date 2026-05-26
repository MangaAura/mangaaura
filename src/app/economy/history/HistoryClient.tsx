'use client';

import { useState } from 'react';
import { History, ArrowRight, ArrowLeft, ShoppingBag, Gift, Wallet } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  timestamp: Date;
}

interface AuraTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  netAmount: number;
  burnedAmount: number;
  createdAt: Date;
}

export function HistoryClient({
  transactions,
  sentTransfers,
  receivedTransfers,
}: {
  transactions: Transaction[];
  sentTransfers: AuraTransfer[];
  receivedTransfers: AuraTransfer[];
}) {
  const [filter, setFilter] = useState<'all' | 'transfers' | 'purchases' | 'referrals' | 'withdrawals'>('all');

  const typeIcons: Record<string, React.ReactNode> = {
    AURA_PURCHASE: <ShoppingBag size={16} className="text-green-500" />,
    TRANSFER_SENT: <ArrowRight size={16} className="text-red-500" />,
    TRANSFER_RECEIVED: <ArrowLeft size={16} className="text-blue-500" />,
    REFERRAL_BONUS: <Gift size={16} className="text-purple-500" />,
    CASH_OUT: <Wallet size={16} className="text-amber-500" />,
    TIP_SENT: <ArrowRight size={16} className="text-red-500" />,
    TIP_RECEIVED: <ArrowLeft size={16} className="text-green-500" />,
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'transfers') return t.type.startsWith('TRANSFER');
    if (filter === 'purchases') return t.type === 'AURA_PURCHASE';
    if (filter === 'referrals') return t.type === 'REFERRAL_BONUS';
    if (filter === 'withdrawals') return t.type === 'CASH_OUT';
    return true;
  });

  if (transactions.length === 0 && sentTransfers.length === 0 && receivedTransfers.length === 0) {
    return (
      <div className="text-center py-12">
        <History size={40} className="mx-auto mb-3 text-muted opacity-50" />
        <p className="text-muted">No hay transacciones aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'transfers', 'purchases', 'referrals', 'withdrawals'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-muted hover:bg-[var(--muted)]/70'
            }`}
          >
            {f === 'all' && 'Todo'}
            {f === 'transfers' && 'Transferencias'}
            {f === 'purchases' && 'Compras'}
            {f === 'referrals' && 'Referidos'}
            {f === 'withdrawals' && 'Retiros'}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filteredTransactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]"
          >
            <div className="flex items-center gap-3">
              {typeIcons[t.type] || <History size={16} className="text-muted" />}
              <div>
                <p className="text-sm font-medium">{t.description || t.type}</p>
                <p className="text-xs text-muted">
                  {new Date(t.timestamp).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <p className={`text-sm font-medium ${t.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} Aura
            </p>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-muted">
            No hay transacciones de este tipo
          </div>
        )}
      </div>
    </div>
  );
}