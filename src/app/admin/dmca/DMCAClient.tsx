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
  FileWarning,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Eye,
  MoreHorizontal,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Textarea } from '@/components/ui/Textarea';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

interface DMCAData {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterAddress: string | null;
  infringingContentId: string | null;
  infringingContentType: string | null;
  originalWorkUrl: string | null;
  originalWorkDescription: string | null;
  goodFaithStatement: boolean;
  signature: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolutionNotes: string | null;
}

export default function DMCAClient() {
  const { handleError } = useErrorHandler();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTakedown, setSelectedTakedown] = useState<DMCAData | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data, error, isLoading, mutate } = useSWR<{ takedowns: DMCAData[]; pagination: { total: number; totalPages: number }; statusCounts: Record<string, number> }>(
    `/api/admin/dmca?page=${page}&status=${statusFilter}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const takedowns = data?.takedowns || [];
  const pagination = data?.pagination;
  const statusCounts = data?.statusCounts || {};

  const performAction = async (action: string) => {
    if (!selectedTakedown) return;
    try {
      const response = await fetch(`/api/admin/dmca/${selectedTakedown.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resolutionNotes: resolutionNotes || undefined }),
      });
      if (response.ok) {
        await mutate();
        setActionDialog({ type: '', open: false });
        setSelectedTakedown(null);
        setResolutionNotes('');
      }
    } catch (error) {
      handleError(error);
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = { PENDING: 'warning', UNDER_REVIEW: 'default', REMOVED: 'success', REJECTED: 'destructive' };
    return <Badge variant={(variants[status] as any) || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const columns: ColumnDef<DMCAData>[] = useMemo(() => [
    {
      accessorKey: 'requesterName',
      header: 'Requester',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.requesterName}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{row.original.requesterEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'infringingContentType',
      header: 'Content Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.infringingContentType || '—'}</Badge>
      ),
    },
    {
      accessorKey: 'originalWorkDescription',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-secondary)] truncate max-w-[200px] block">
          {row.original.originalWorkDescription || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submitted',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-tertiary)]">
          {new Date(row.original.submittedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedTakedown(row.original); performAction('review'); }}>
              <Eye className="w-4 h-4 mr-2" /> Mark as Reviewing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedTakedown(row.original); setResolutionNotes(''); setActionDialog({ type: 'approve', open: true }); }}>
              <Check className="w-4 h-4 mr-2 text-green-500" /> Approve Removal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedTakedown(row.original); setResolutionNotes(''); setActionDialog({ type: 'reject', open: true }); }}>
              <X className="w-4 h-4 mr-2 text-[var(--error)]" /> Reject
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({
    data: takedowns,
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
          <FileWarning className="w-6 h-6 text-[var(--primary)]" />
          DMCA Takedowns
        </h1>
        <p className="text-[var(--text-muted)]">Manage copyright takedown requests</p>
      </div>

      <div className="flex gap-4">
        {['PENDING', 'UNDER_REVIEW', 'REMOVED', 'REJECTED'].map((s) => (
          <Card key={s} className={`flex-1 cursor-pointer ${statusFilter === s ? 'ring-2 ring-[var(--primary)]' : ''}`} onClick={() => { setStatusFilter(s === statusFilter ? '' : s); setPage(1); }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{s.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Takedown Requests{' '}
            <span className="text-[var(--text-tertiary)] font-normal">({pagination?.total || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load DMCA requests</div>
          ) : takedowns.length === 0 ? (
            <div className="text-center py-12">
              <FileWarning className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">No takedown requests</h3>
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

      <Dialog open={actionDialog.type === 'approve'} onOpenChange={(o) => setActionDialog({ type: o ? 'approve' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Takedown</DialogTitle>
            <DialogDescription>This will mark the content as removed per DMCA request.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Resolution Notes</label>
            <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} placeholder="Optional notes about this resolution" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button onClick={() => performAction('approve')}>
              <Check className="w-4 h-4 mr-2" /> Approve & Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'reject'} onOpenChange={(o) => setActionDialog({ type: o ? 'reject' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Takedown</DialogTitle>
            <DialogDescription>The content will remain as-is.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Resolution Notes</label>
            <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} placeholder="Reason for rejection" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => performAction('reject')}>
              <X className="w-4 h-4 mr-2" /> Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
