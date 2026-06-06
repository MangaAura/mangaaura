'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Ban,
  Loader2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface SubscriptionData {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  subscriptionEndsAt: string | null;
  auraLifetimePurchased: number;
  auraBalance: number;
  createdAt: string;
}

export default function SubscriptionsClient() {
  const t = useT();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ subscriptions: SubscriptionData[]; pagination: { total: number; totalPages: number } }>(
    `/api/admin/subscriptions?page=${page}&status=${statusFilter}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const subscriptions = data?.subscriptions || [];
  const pagination = data?.pagination;

  const handleCancelSubscription = async () => {
    if (!selectedSubscription?.subscriptionId) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${selectedSubscription.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });

      if (res.ok) {
        await mutate();
        setShowCancelDialog(false);
        setSelectedSubscription(null);
        setCancelReason('');
        toast({
          title: 'Subscription cancelled',
          description: `Subscription for ${selectedSubscription.username} has been cancelled.`,
          variant: 'success',
        });
      } else {
        const err = await res.json();
        toast({
          title: 'Error',
          description: err.error || 'Failed to cancel subscription',
          variant: 'error',
        });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const columns: ColumnDef<SubscriptionData>[] = useMemo(() => [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-xs font-medium overflow-hidden">
            {row.original.avatarUrl ? (
              <img src={row.original.avatarUrl} alt={row.original.username} className="w-full h-full object-cover" />
            ) : (
              row.original.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{row.original.displayName || row.original.username}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'subscriptionTier',
      header: 'Tier',
      cell: ({ row }) => (
        <Badge variant={row.original.subscriptionTier === 'premium' ? 'default' : 'secondary'}>
          {row.original.subscriptionTier || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.subscriptionStatus;
        const variant = status === 'active' ? 'success' as const : status === 'past_due' ? 'warning' as const : 'destructive' as const;
        return <Badge variant={variant}>{status || 'none'}</Badge>;
      },
    },
    {
      accessorKey: 'subscriptionEndsAt',
      header: 'Ends',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-tertiary)]">
          {row.original.subscriptionEndsAt ? new Date(row.original.subscriptionEndsAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'auraBalance',
      header: 'Aura',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.auraBalance.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Since',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-tertiary)]">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.subscriptionStatus === 'active' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedSubscription(row.original);
                setCancelReason('');
                setShowCancelDialog(true);
              }}
              title="Cancel subscription"
            >
              <Ban className="w-4 h-4 text-[var(--error)]" />
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[var(--primary)]" />
          {t('admin.pages.subscriptions.title')}
        </h1>
        <p className="text-[var(--text-muted)]">{t('admin.pages.subscriptions.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Subscribers{' '}
            <span className="text-[var(--text-tertiary)] font-normal">({pagination?.total || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load subscriptions</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">No subscriptions found</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b">
                        {hg.headers.map((h) => (
                          <th key={h.id} className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-[var(--surface)]">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-[var(--text-tertiary)]">Page {page} of {pagination.totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-[var(--error)]" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              This will cancel the active subscription for {selectedSubscription?.username}. 
              The user will retain access until the end of the billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Reason (optional)</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why is this subscription being cancelled?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Ban className="w-4 h-4 mr-2" />
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
