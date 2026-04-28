'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserX,
  Trash2,
  Eye,
  Shield,
  Search,
  Filter,
  Ban,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface ReportedComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  chapterId: string;
  mangaTitle: string;
  chapterNumber: number;
  reportCount: number;
  status: 'pending' | 'approved' | 'rejected';
  isDeleted: boolean;
  createdAt: string;
  likesCount: number;
  repliesCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ModerationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportedComment | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'ban' | 'delete'>('approve');
  const [isActioning, setIsActioning] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ reports: ReportedComment[] }>(
    '/api/admin/moderation',
    fetcher,
    { refreshInterval: 30000 }
  );

  const reports = data?.reports || [];

  const handleAction = async () => {
    if (!selectedReport) return;
    setIsActioning(true);

    try {
      const response = await fetch(`/api/admin/moderation/${selectedReport.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }),
      });

      if (response.ok) {
        await mutate();
        setShowActionDialog(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsActioning(false);
    }
  };

  const columns: ColumnDef<ReportedComment>[] = useMemo(
    () => [
      {
        accessorKey: 'content',
        header: 'Comment',
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="text-sm text-slate-900 line-clamp-2">{row.original.content}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              by {row.original.userName} • {new Date(row.original.createdAt).toLocaleDateString()}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'mangaTitle',
        header: 'Location',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-slate-900">{row.original.mangaTitle}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Chapter {row.original.chapterNumber}</p>
          </div>
        ),
      },
      {
        accessorKey: 'reportCount',
        header: 'Reports',
        cell: ({ row }) => (
          <Badge
            variant={row.original.reportCount >= 3 ? 'destructive' : 'default'}
            className="font-medium"
          >
            {row.original.reportCount}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'pending'
                ? 'outline'
                : row.original.status === 'approved'
                ? 'default'
                : 'secondary'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReport(row.original);
                setActionType('approve');
                setShowActionDialog(true);
              }}
              title="Approve"
            >
              <CheckCircle className="w-4 h-4 text-[var(--success)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReport(row.original);
                setActionType('reject');
                setShowActionDialog(true);
              }}
              title="Reject"
            >
              <XCircle className="w-4 h-4 text-[var(--error)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReport(row.original);
                setActionType('ban');
                setShowActionDialog(true);
              }}
              title="Ban User"
            >
              <UserX className="w-4 h-4 text-[var(--warning)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReport(row.original);
                setActionType('delete');
                setShowActionDialog(true);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-[var(--error)]" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    let filtered = reports;

    if (filterType !== 'all') {
      filtered = filtered.filter(
        (r) => r.status === filterType || (filterType === 'high' && r.reportCount >= 3)
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.content.toLowerCase().includes(query) ||
          r.userName.toLowerCase().includes(query) ||
          r.mangaTitle.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reports, filterType, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            Moderation
          </h1>
          <p className="text-[var(--text-muted)]">Manage reported content and user violations</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Search comments, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reported Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-[var(--error)]">
              Failed to load reports
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[var(--success)]" />
              <h3 className="text-lg font-medium text-slate-900">No reports found</h3>
              <p className="text-[var(--text-tertiary)]">All clear! No content waiting for moderation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Comment'}
              {actionType === 'reject' && 'Reject Comment'}
              {actionType === 'ban' && 'Ban User'}
              {actionType === 'delete' && 'Delete Comment'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'This will mark the comment as safe and clear all reports.'}
              {actionType === 'reject' && 'This will hide the comment from public view.'}
              {actionType === 'ban' && 'This will ban the user from posting comments.'}
              {actionType === 'delete' && 'This will permanently delete the comment.'}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-slate-700">Comment:</p>
              <p className="text-sm text-slate-900 mt-1">{selectedReport.content}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                By {selectedReport.userName} • {selectedReport.reportCount} reports
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={isActioning}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={isActioning}
            >
              {isActioning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === 'approve' && (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
              {actionType === 'reject' && (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
              {actionType === 'ban' && (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </>
              )}
              {actionType === 'delete' && (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
