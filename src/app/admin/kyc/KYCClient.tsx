'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ShieldCheck, Check, X, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

interface KYCUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  kycStatus: string;
  kycVerifiedAt: string | null;
  auraBalance: number;
  auraLifetimePurchased: number;
  auraLifetimeWithdrawn: number;
  createdAt: string;
  updatedAt: string;
}

export default function KYCClient() {
  const { handleError } = useErrorHandler();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });

  const { data, error, isLoading, mutate } = useSWR<{ users: KYCUser[]; statusCounts: Record<string, number> }>(
    `/api/admin/kyc?status=${statusFilter}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const users = data?.users || [];
  const statusCounts = data?.statusCounts || {};

  const performAction = async (action: string) => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/kyc/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        await mutate();
        setActionDialog({ type: '', open: false });
        setSelectedUser(null);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = { verified: 'success', pending: 'warning', rejected: 'destructive', none: 'secondary' };
    return <Badge variant={(variants[status] as any) || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
          KYC Verification
        </h1>
        <p className="text-[var(--text-muted)]">Review and verify user KYC (Know Your Customer) requests</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['none', 'pending', 'verified', 'rejected'].map((s) => (
          <Card key={s} className={`cursor-pointer ${statusFilter === s ? 'ring-2 ring-[var(--primary)]' : ''}`} onClick={() => setStatusFilter(s)}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
              <p className="text-sm text-[var(--text-tertiary)] capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">Failed to load KYC data</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">No {statusFilter} users found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-sm font-medium overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.displayName || user.username}</p>
                    <p className="text-sm text-[var(--text-tertiary)]">{user.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                      <span>Aura: {user.auraBalance.toLocaleString()}</span>
                      <span>Purchased: {user.auraLifetimePurchased.toLocaleString()}</span>
                      <span>Withdrawn: {user.auraLifetimeWithdrawn.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(user.kycStatus)}
                  {user.kycStatus === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); performAction('approve'); }}>
                        <Check className="w-4 h-4 mr-1 text-green-500" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setActionDialog({ type: 'reject', open: true }); }}>
                        <X className="w-4 h-4 mr-1 text-[var(--error)]" /> Reject
                      </Button>
                    </div>
                  )}
                  {user.kycStatus === 'verified' && (
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); performAction('reset'); }}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={actionDialog.type === 'reject'} onOpenChange={(o) => setActionDialog({ type: o ? 'reject' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>This will mark the user's KYC as rejected. They will be able to resubmit.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => performAction('reject')}>
              <X className="w-4 h-4 mr-2" /> Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
