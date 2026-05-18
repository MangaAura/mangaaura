'use client';

import { useT } from '@/i18n';
import { ArrowDown, ArrowUp, Clock, Coins, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const typeConfig: Record<string, { icon: typeof ArrowUp; color: string; labelKey: string }> = {
  TIP_SENT: { icon: ArrowUp, color: 'text-red-400', labelKey: 'transactions.tipSent' },
  TIP_RECEIVED: { icon: ArrowDown, color: 'text-green-400', labelKey: 'transactions.tipReceived' },
  CROWDFUND_CONTRIBUTION: { icon: ArrowUp, color: 'text-orange-400', labelKey: 'transactions.crowdfund' },
  INKCOINS_PURCHASE: { icon: ArrowDown, color: 'text-blue-400', labelKey: 'transactions.purchase' },
  XP_EARNED: { icon: Trophy, color: 'text-purple-400', labelKey: 'transactions.xpEarned' },
};

interface Transaction {
  id: string; type: string; amount: number;
  description: string | null; timestamp: Date;
}

export function TransactionsClient({ transactions, balance }: {
  transactions: Transaction[];
  balance: { inkcoinsBalance: number; xpPoints: number } | null;
}) {
  const t = useT();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>

      {balance && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Coins className="w-5 h-5 text-yellow-400" /> InkCoins</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{balance.inkcoinsBalance.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Trophy className="w-5 h-5 text-purple-400" /> XP</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{balance.xpPoints.toLocaleString()}</p></CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-2">
        {transactions.length === 0 && (
          <p className="text-center text-[var(--text-muted)] py-12">{t('transactions.empty')}</p>
        )}
        {transactions.map((tx) => {
          const config = typeConfig[tx.type] || { icon: Clock, color: 'text-gray-400', labelKey: '' };
          const Icon = config.icon;
          const isOutgoing = tx.type === 'TIP_SENT' || tx.type === 'CROWDFUND_CONTRIBUTION';
          return (
            <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className={`p-2 rounded-lg bg-[var(--surface-elevated)] ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{tx.description || t(config.labelKey)}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{new Date(tx.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${isOutgoing ? 'text-red-400' : 'text-green-400'}`}>
                  {isOutgoing ? '-' : '+'}{tx.amount}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
