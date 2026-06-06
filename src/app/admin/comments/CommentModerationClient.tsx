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
  Search,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Undo2,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/Input';
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

interface CommentUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentChapter {
  id: string;
  chapterNumber: number;
  mangaId: string;
  manga: { id: string; title: string; slug: string };
}

interface CommentData {
  id: string;
  content: string;
  isHidden: boolean;
  isDeleted: boolean;
  hiddenReason: string | null;
  likesCount: number;
  repliesCount: number;
  user: CommentUser;
  chapter: CommentChapter;
  createdAt: string;
  updatedAt: string;
}

export default function CommentModerationClient() {
  const t = useT();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);
  const [expandedComment, setExpandedComment] = useState<CommentData | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });
  const [editContent, setEditContent] = useState('');
  const [hideReason, setHideReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const { data, error, isLoading, mutate } = useSWR<{ comments: CommentData[]; pagination: { total: number; totalPages: number } }>(
    `/api/admin/comments?page=${page}&search=${searchQuery}&status=${statusFilter}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const comments = data?.comments || [];
  const pagination = data?.pagination;

  const performAction = async (action: string, extraData?: Record<string, string>) => {
    if (!selectedComment) return;
    try {
      const response = await fetch(`/api/admin/comments/${selectedComment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });
      if (response.ok) {
        await mutate();
        setActionDialog({ type: '', open: false });
        setSelectedComment(null);
        setEditContent('');
        setHideReason('');
        toast({ title: 'Done', description: `Comment ${action} successful.`, variant: 'success' });
      } else {
        toast({ title: 'Error', description: `Failed to ${action} comment.`, variant: 'error' });
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'error' });
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction) return;
    try {
      const res = await fetch('/api/admin/comments/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentIds: Array.from(selectedIds), action: bulkAction }),
      });
      if (res.ok) {
        await mutate();
        setSelectedIds(new Set());
        setBulkAction('');
        toast({ title: 'Done', description: `${selectedIds.size} comments ${bulkAction}ed.`, variant: 'success' });
      } else {
        toast({ title: 'Error', description: 'Bulk action failed.', variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'error' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const columns: ColumnDef<CommentData>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={(e) => {
            table.toggleAllRowsSelected(e.target.checked);
            if (e.target.checked) setSelectedIds(new Set(comments.map((c) => c.id)));
            else setSelectedIds(new Set());
          }}
          className="rounded border-[var(--border)]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggleSelect(row.original.id)}
          className="rounded border-[var(--border)]"
        />
      ),
    },
    {
      accessorKey: 'content',
      header: t('admin.pages.comments.columns.comment'),
      cell: ({ row }) => (
        <div className="max-w-md">
          <button
            onClick={() => setExpandedComment(row.original)}
            className="text-left w-full"
          >
            <p className={`text-sm ${row.original.isDeleted ? 'text-[var(--text-tertiary)] italic line-through' : 'text-[var(--text-primary)]'}`}>
              {row.original.isDeleted ? t('admin.pages.comments.deletedLabel') : row.original.content.substring(0, 150)}
              {row.original.content.length > 150 && '...'}
            </p>
          </button>
          {row.original.isHidden && row.original.hiddenReason && (
            <p className="text-xs text-[var(--warning)] mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {t('admin.pages.comments.hiddenReason', { reason: row.original.hiddenReason })}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: t('admin.pages.comments.columns.user'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-xs font-medium overflow-hidden">
            {row.original.user.avatarUrl ? (
              <img src={row.original.user.avatarUrl} alt={row.original.user.username} className="w-full h-full object-cover" />
            ) : (
              row.original.user.username.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm">{row.original.user.displayName || row.original.user.username}</span>
        </div>
      ),
    },
    {
      accessorKey: 'chapter',
      header: t('admin.pages.comments.columns.chapter'),
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="text-[var(--text-secondary)] truncate max-w-[150px]">{row.original.chapter?.manga?.title || t('admin.pages.comments.unknownChapter')}</p>
          <p className="text-[var(--text-tertiary)]">Ch. {row.original.chapter?.chapterNumber || '?'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('admin.pages.comments.columns.status'),
      cell: ({ row }) => {
        if (row.original.isDeleted) return <Badge variant="destructive">{t('admin.pages.comments.deleted')}</Badge>;
        if (row.original.isHidden) return <Badge variant="warning">{t('admin.pages.comments.hidden')}</Badge>;
        return <Badge variant="success">{t('admin.pages.comments.visible')}</Badge>;
      },
    },
    {
      accessorKey: 'stats',
      header: t('admin.pages.comments.columns.stats'),
      cell: ({ row }) => (
        <div className="text-sm text-[var(--text-tertiary)]">
          <span>{t('admin.pages.comments.stats.likes', { count: row.original.likesCount })}</span>
          <span className="ml-2">{t('admin.pages.comments.stats.replies', { count: row.original.repliesCount })}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('admin.pages.comments.columns.date'),
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-tertiary)]">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('admin.pages.comments.columns.actions'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setExpandedComment(row.original)}>
              <FileText className="w-4 h-4 mr-2" /> {t('admin.pages.comments.actions.viewDetails')}
            </DropdownMenuItem>
            {!row.original.isDeleted && (
              <>
                {row.original.isHidden ? (
                  <DropdownMenuItem onClick={() => { setSelectedComment(row.original); performAction('unhide'); }}>
                    <Eye className="w-4 h-4 mr-2" /> {t('admin.pages.comments.actions.unhide')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setHideReason(''); setActionDialog({ type: 'hide', open: true }); }}>
                    <EyeOff className="w-4 h-4 mr-2" /> {t('admin.pages.comments.actions.hide')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setEditContent(row.original.content); setActionDialog({ type: 'edit', open: true }); }}>
                  <Edit className="w-4 h-4 mr-2" /> {t('admin.pages.comments.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setActionDialog({ type: 'delete', open: true }); }}>
                  <Trash2 className="w-4 h-4 mr-2 text-[var(--error)]" /> {t('admin.pages.comments.actions.softDelete')}
                </DropdownMenuItem>
              </>
            )}
            {row.original.isDeleted && (
              <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setEditContent(row.original.content); setActionDialog({ type: 'restore', open: true }); }}>
                <Undo2 className="w-4 h-4 mr-2" /> {t('admin.pages.comments.actions.restore')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [comments, selectedIds]);

  const table = useReactTable({
    data: comments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.comments.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.comments.subtitle')}</p>
        </div>
      </div>

      {/* Filters + Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder={t('admin.pages.comments.search')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.pages.comments.filterAll')}</SelectItem>
                <SelectItem value="visible">{t('admin.pages.comments.visible')}</SelectItem>
                <SelectItem value="hidden">{t('admin.pages.comments.hidden')}</SelectItem>
                <SelectItem value="deleted">{t('admin.pages.comments.deleted')}</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={`${selectedIds.size} selected`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hide">{t('admin.pages.comments.actions.hide')}</SelectItem>
                    <SelectItem value="unhide">{t('admin.pages.comments.actions.unhide')}</SelectItem>
                    <SelectItem value="delete">{t('admin.pages.comments.actions.softDelete')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="default" size="sm" onClick={handleBulkAction} disabled={!bulkAction}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Apply
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedIds(new Set()); setBulkAction(''); }}>
                  {t('admin.pages.comments.cancel')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.pages.comments.title')}
            <span className="text-[var(--text-tertiary)] font-normal">({pagination?.total || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.comments.loadError')}</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">{t('admin.pages.comments.empty')}</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className={`border-b hover:bg-[var(--surface)] ${row.original.isHidden ? 'bg-[var(--surface-sunken)]' : ''}`}>
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
                  <div className="text-sm text-[var(--text-tertiary)]">{t('admin.page')} {page} {t('admin.of')} {pagination.totalPages}</div>
                  <div className="flex items-center gap-2">
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

      {/* Expanded Content Dialog */}
      <Dialog open={!!expandedComment} onOpenChange={(o) => { if (!o) setExpandedComment(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" />
              {t('admin.pages.comments.viewDetails')}
            </DialogTitle>
          </DialogHeader>
          {expandedComment && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 bg-[var(--surface)] p-3 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-sm font-medium overflow-hidden">
                  {expandedComment.user.avatarUrl ? (
                    <img src={expandedComment.user.avatarUrl} alt={expandedComment.user.username} className="w-full h-full object-cover" />
                  ) : (
                    expandedComment.user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{expandedComment.user.displayName || expandedComment.user.username}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">@{expandedComment.user.username}</p>
                </div>
              </div>

              {/* Manga context */}
              <div className="bg-[var(--surface)] p-3 rounded-lg">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Context</p>
                <Link
                  href={`/manga/${expandedComment.chapter?.manga?.slug || ''}/chapter/${expandedComment.chapter?.chapterNumber || ''}`}
                  target="_blank"
                  className="text-sm text-[var(--primary)] hover:underline mt-1 flex items-center gap-1"
                >
                  {expandedComment.chapter?.manga?.title || 'Unknown Manga'} — Ch. {expandedComment.chapter?.chapterNumber || '?'}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Full content */}
              <div className="bg-[var(--surface)] p-4 rounded-lg">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Content</p>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{expandedComment.content}</p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Likes</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{expandedComment.likesCount}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Replies</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{expandedComment.repliesCount}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Created</p>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{new Date(expandedComment.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-[var(--surface)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Updated</p>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{new Date(expandedComment.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {expandedComment.hiddenReason && (
                <div className="bg-[var(--warning)]/5 border border-[var(--warning)]/20 p-3 rounded-lg">
                  <p className="text-xs text-[var(--warning)] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Hidden Reason
                  </p>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{expandedComment.hiddenReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpandedComment(null)}>{t('admin.pages.comments.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialogs */}
      <Dialog open={actionDialog.type === 'hide'} onOpenChange={(o) => setActionDialog({ type: o ? 'hide' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.comments.hideTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.comments.hideDesc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.comments.hideReason')}</label>
            <Input value={hideReason} onChange={(e) => setHideReason(e.target.value)} placeholder={t('admin.pages.comments.hideReasonPlaceholder')} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>{t('admin.pages.comments.cancel')}</Button>
            <Button onClick={() => performAction('hide', { hiddenReason: hideReason || 'Hidden by moderator' })}>
              <EyeOff className="w-4 h-4 mr-2" /> {t('admin.pages.comments.hideButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'edit'} onOpenChange={(o) => setActionDialog({ type: o ? 'edit' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.comments.editTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.comments.editDesc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>{t('admin.pages.comments.cancel')}</Button>
            <Button onClick={() => performAction('edit', { content: editContent })}>
              <Edit className="w-4 h-4 mr-2" /> {t('admin.pages.comments.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'delete'} onOpenChange={(o) => setActionDialog({ type: o ? 'delete' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.comments.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.comments.deleteDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>{t('admin.pages.comments.cancel')}</Button>
            <Button variant="destructive" onClick={() => performAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" /> {t('admin.pages.comments.deleteButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'restore'} onOpenChange={(o) => setActionDialog({ type: o ? 'restore' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.comments.restoreTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.comments.restoreDesc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Original content</label>
            <p className="text-sm text-[var(--text-primary)] mt-1 p-3 bg-[var(--surface)] rounded">{editContent}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>{t('admin.pages.comments.cancel')}</Button>
            <Button onClick={() => performAction('restore', { content: editContent })}>
              <Undo2 className="w-4 h-4 mr-2" /> {t('admin.pages.comments.actions.restore')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
