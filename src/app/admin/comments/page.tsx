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
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrar Comentarios | MangaAura',
  description: 'Modera y gestiona los comentarios en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Comentarios | MangaAura',
    description: 'Modera y gestiona los comentarios en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Comentarios | MangaAura',
    description: 'Modera los comentarios en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/comments' },
};

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

export default function CommentModerationPage() {
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });
  const [editContent, setEditContent] = useState('');
  const [hideReason, setHideReason] = useState('');

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
      }
    } catch (error) {
      handleError(error);
    }
  };

  const columns: ColumnDef<CommentData>[] = useMemo(() => [
    {
      accessorKey: 'content',
      header: 'Comment',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className={`text-sm ${row.original.isDeleted ? 'text-[var(--text-tertiary)] italic line-through' : 'text-[var(--text-primary)]'}`}>
            {row.original.isDeleted ? '[deleted]' : row.original.content.substring(0, 150)}
            {row.original.content.length > 150 && '...'}
          </p>
          {row.original.isHidden && row.original.hiddenReason && (
            <p className="text-xs text-[var(--warning)] mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Hidden: {row.original.hiddenReason}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-xs font-medium overflow-hidden">
            {row.original.user.avatarUrl ? (
              <img src={row.original.user.avatarUrl} alt="" className="w-full h-full object-cover" />
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
      header: 'Chapter',
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="text-[var(--text-secondary)] truncate max-w-[150px]">{row.original.chapter?.manga?.title || 'Unknown'}</p>
          <p className="text-[var(--text-tertiary)]">Ch. {row.original.chapter?.chapterNumber || '?'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.isDeleted) return <Badge variant="destructive">Deleted</Badge>;
        if (row.original.isHidden) return <Badge variant="warning">Hidden</Badge>;
        return <Badge variant="success">Visible</Badge>;
      },
    },
    {
      accessorKey: 'stats',
      header: 'Stats',
      cell: ({ row }) => (
        <div className="text-sm text-[var(--text-tertiary)]">
          <span>{row.original.likesCount} likes</span>
          <span className="ml-2">{row.original.repliesCount} replies</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!row.original.isDeleted && (
              <>
                {row.original.isHidden ? (
                  <DropdownMenuItem onClick={() => { setSelectedComment(row.original); performAction('unhide'); }}>
                    <Eye className="w-4 h-4 mr-2" /> Unhide
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setHideReason(''); setActionDialog({ type: 'hide', open: true }); }}>
                    <EyeOff className="w-4 h-4 mr-2" /> Hide
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setEditContent(row.original.content); setActionDialog({ type: 'edit', open: true }); }}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setActionDialog({ type: 'delete', open: true }); }}>
                  <Trash2 className="w-4 h-4 mr-2 text-[var(--error)]" /> Soft Delete
                </DropdownMenuItem>
              </>
            )}
            {row.original.isDeleted && (
              <DropdownMenuItem onClick={() => { setSelectedComment(row.original); setEditContent(row.original.content); setActionDialog({ type: 'restore', open: true }); }}>
                <Undo2 className="w-4 h-4 mr-2" /> Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

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
            Comment Moderation
          </h1>
          <p className="text-[var(--text-muted)]">Review and moderate all comments across the platform</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Search by content, username..."
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
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Comments{' '}
            <span className="text-[var(--text-tertiary)] font-normal">({pagination?.total || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load comments</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">No comments found</h3>
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
                  <div className="text-sm text-[var(--text-tertiary)]">Page {page} of {pagination.totalPages}</div>
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

      <Dialog open={actionDialog.type === 'hide'} onOpenChange={(o) => setActionDialog({ type: o ? 'hide' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide Comment</DialogTitle>
            <DialogDescription>This will hide the comment from public view. The user will still see it.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Reason (optional)</label>
            <Input value={hideReason} onChange={(e) => setHideReason(e.target.value)} placeholder="e.g. Spam, inappropriate content" className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button onClick={() => performAction('hide', { hiddenReason: hideReason || 'Hidden by moderator' })}>
              <EyeOff className="w-4 h-4 mr-2" /> Hide Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'edit'} onOpenChange={(o) => setActionDialog({ type: o ? 'edit' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogDescription>Modify the comment content.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button onClick={() => performAction('edit', { content: editContent })}>
              <Edit className="w-4 h-4 mr-2" /> Save Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'delete'} onOpenChange={(o) => setActionDialog({ type: o ? 'delete' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment (Soft)</DialogTitle>
            <DialogDescription>The content will be replaced with "[deleted]" but the comment record will be kept.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => performAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" /> Soft Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'restore'} onOpenChange={(o) => setActionDialog({ type: o ? 'restore' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Comment</DialogTitle>
            <DialogDescription>The original content will be restored.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Original content</label>
            <p className="text-sm text-[var(--text-primary)] mt-1 p-3 bg-[var(--surface)] rounded">{editContent}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button onClick={() => performAction('restore', { content: editContent })}>
              <Undo2 className="w-4 h-4 mr-2" /> Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
