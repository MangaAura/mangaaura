'use client';

import { ShieldCheck, Check, X, RotateCcw, FileText, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

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
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
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
  const t = useT();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });
  const [kycNotes, setKycNotes] = useState('');

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
        body: JSON.stringify({ action, notes: kycNotes }),
      });
      if (response.ok) {
        await mutate();
        setActionDialog({ type: '', open: false });
        setSelectedUser(null);
        setKycNotes('');
        toast({
          title: 'KYC updated',
          description: `User ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reset'} successfully`,
          variant: 'success',
        });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.error || 'Action failed', variant: 'destructive' });
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'Failed to perform action', variant: 'destructive' });
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
          {t('admin.pages.kyc.title')}
        </h1>
        <p className="text-[var(--text-muted)]">{t('admin.pages.kyc.subtitle')}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['none', 'pending', 'verified', 'rejected'].map((s) => (
          <Card key={s} className={`h-full cursor-pointer ${statusFilter === s ? 'ring-2 ring-[var(--primary)]' : ''}`} onClick={() => setStatusFilter(s)}>
            <CardContent className="p-4 h-full flex flex-col justify-center items-center">
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
        <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.kyc.loadError') || 'Failed to load KYC data'}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">No {statusFilter} users found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-sm font-medium overflow-hidden flex-shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={`Avatar de ${user.username}`} className="w-full h-full object-cover" />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.displayName || user.username}</p>
                      <p className="text-sm text-[var(--text-tertiary)] truncate">{user.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                        <span>Aura: {user.auraBalance.toLocaleString()}</span>
                        <span>Purchased: {user.auraLifetimePurchased.toLocaleString()}</span>
                        <span>Withdrawn: {user.auraLifetimeWithdrawn.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {statusBadge(user.kycStatus)}
                    {user.kycStatus === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setKycNotes(''); performAction('approve'); }}>
                          <Check className="w-4 h-4 mr-1 text-green-500" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setActionDialog({ type: 'reject', open: true }); }}>
                          <X className="w-4 h-4 mr-1 text-[var(--error)]" /> Reject
                        </Button>
                      </div>
                    )}
                    {user.kycStatus === 'verified' && (
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setKycNotes(''); performAction('reset'); }}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => { setSelectedUser(user); setActionDialog({ type: 'details', open: true }); }}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View details
                  </button>
                  {user.kycStatus !== 'none' && (
                    <button
                      onClick={() => { setSelectedUser(user); setKycNotes(''); setActionDialog({ type: 'reject', open: true }); }}
                      className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Add notes
                    </button>
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
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rejection notes (optional)</Label>
              <Textarea
                value={kycNotes}
                onChange={(e) => setKycNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about why this KYC was rejected..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => performAction('reject')}>
              <X className="w-4 h-4 mr-2" /> Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'details'} onOpenChange={(o) => setActionDialog({ type: o ? 'details' : '', open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              KYC Details
            </DialogTitle>
            <DialogDescription>User identity verification details.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Username</p>
                  <p className="font-medium">{selectedUser.username}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Email</p>
                  <p className="font-medium truncate">{selectedUser.email}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">KYC Status</p>
                  <div className="mt-1">{statusBadge(selectedUser.kycStatus)}</div>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Verified at</p>
                  <p className="font-medium">{selectedUser.kycVerifiedAt ? new Date(selectedUser.kycVerifiedAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Aura Balance</p>
                  <p className="font-medium">{selectedUser.auraBalance.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Joined</p>
                  <p className="font-medium text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="bg-[var(--surface-sunken)] p-4 rounded-lg">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Identity Documents</p>
                <p className="text-sm text-[var(--text-muted)]">Document images are not available in this view. Check the user's profile for uploaded verification documents.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
