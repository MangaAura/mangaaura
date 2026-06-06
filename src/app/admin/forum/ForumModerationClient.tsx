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
  MessageCircle,
  Pin,
  PinOff,
  Lock,
  LockOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface ThreadAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ThreadCategory {
  id: string;
  name: string;
  slug: string;
}

interface ThreadData {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  author: ThreadAuthor;
  category: ThreadCategory;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ForumModerationClient() {
  const { handleError } = useErrorHandler();
  const t = useT();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });

  const { data, error, isLoading, mutate } = useSWR<{ threads: ThreadData[]; pagination: { total: number; totalPages: number } }>(
    `/api/admin/forum/threads?page=${page}&search=${searchQuery}&status=${statusFilter}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const threads = data?.threads || [];
  const pagination = data?.pagination;

  const performAction = async (action: string) => {
    if (!selectedThread) return;
    try {
      const response = await fetch(`/api/admin/forum/threads/${selectedThread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        await mutate();
        setActionDialog({ type: '', open: false });
        setSelectedThread(null);
        toast({ title: t('admin.pages.forum.title'), description: `${action} successful`, variant: 'success' });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const columns: ColumnDef<ThreadData>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: t('admin.pages.forum.columns.thread'),
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            {row.original.isPinned && <Pin className="w-4 h-4 text-[var(--accent-orange)]" />}
            {row.original.isLocked && <Lock className="w-4 h-4 text-[var(--error)]" />}
            <p className="font-medium truncate">{row.original.title}</p>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{row.original.content}</p>
        </div>
      ),
    },
    {
      accessorKey: 'author',
      header: t('admin.pages.forum.columns.author'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-xs font-medium overflow-hidden">
            {row.original.author.avatarUrl ? (
              <img src={row.original.author.avatarUrl} alt={`Avatar de ${row.original.author.username}`} className="w-full h-full object-cover" />
            ) : (
              row.original.author.username.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm">{row.original.author.displayName || row.original.author.username}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: t('admin.pages.forum.columns.category'),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.category.name}</Badge>
      ),
    },
    {
      accessorKey: 'stats',
      header: t('admin.pages.forum.columns.stats'),
      cell: ({ row }) => (
        <div className="text-sm text-[var(--text-tertiary)]">
          <span>{row.original.viewCount} views</span>
          <span className="ml-2">{row.original.postCount} posts</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('admin.pages.forum.columns.status'),
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.isPinned && <Badge variant="warning">Pinned</Badge>}
          {row.original.isLocked && <Badge variant="destructive">Locked</Badge>}
          {!row.original.isPinned && !row.original.isLocked && <Badge variant="success">Active</Badge>}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('admin.pages.forum.columns.date'),
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-tertiary)]">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('admin.pages.forum.columns.actions'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.original.isPinned ? (
              <DropdownMenuItem onClick={() => { setSelectedThread(row.original); performAction('unpin'); }}>
                <PinOff className="w-4 h-4 mr-2" /> {t('admin.pages.forum.actions.unpin')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => { setSelectedThread(row.original); performAction('pin'); }}>
                <Pin className="w-4 h-4 mr-2" /> {t('admin.pages.forum.actions.pin')}
              </DropdownMenuItem>
            )}
            {row.original.isLocked ? (
              <DropdownMenuItem onClick={() => { setSelectedThread(row.original); performAction('unlock'); }}>
                <LockOpen className="w-4 h-4 mr-2" /> {t('admin.pages.forum.actions.unlock')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => { setSelectedThread(row.original); setActionDialog({ type: 'lock', open: true }); }}>
                <Lock className="w-4 h-4 mr-2" /> {t('admin.pages.forum.actions.lock')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => { setSelectedThread(row.original); setActionDialog({ type: 'delete', open: true }); }}>
              <Trash2 className="w-4 h-4 mr-2 text-[var(--error)]" /> {t('admin.pages.forum.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({
    data: threads,
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
            <MessageCircle className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.forum.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.forum.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder={t('admin.pages.forum.search')}
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
                <SelectItem value="all">{t('admin.pages.forum.filterAll')}</SelectItem>
                <SelectItem value="pinned">{t('admin.pages.forum.filterPinned')}</SelectItem>
                <SelectItem value="locked">{t('admin.pages.forum.filterLocked')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.pages.forum.allThreads')}{' '}
            <span className="text-[var(--text-tertiary)] font-normal">({pagination?.total || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.forum.loadError')}</div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">{t('admin.pages.forum.empty')}</h3>
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
                      <tr key={row.id} className={`border-b hover:bg-[var(--surface)] ${row.original.isPinned ? 'bg-[var(--surface-sunken)]' : ''}`}>
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

      <Dialog open={actionDialog.type === 'lock'} onOpenChange={(o) => setActionDialog({ type: o ? 'lock' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.forum.dialogs.lock.title')}</DialogTitle>
            <DialogDescription>{t('admin.pages.forum.dialogs.lock.desc')}</DialogDescription>
          </DialogHeader>
          {selectedThread && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="font-medium">{selectedThread.title}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>{t('admin.pages.forum.cancel')}</Button>
            <Button onClick={() => performAction('lock')}>
              <Lock className="w-4 h-4 mr-2" /> {t('admin.pages.forum.actions.lock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'delete'} onOpenChange={(o) => setActionDialog({ type: o ? 'delete' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.forum.dialogs.delete.title')}</DialogTitle>
            <DialogDescription>{t('admin.pages.forum.dialogs.delete.desc')}</DialogDescription>
          </DialogHeader>
          {selectedThread && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="font-medium">{selectedThread.title}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{selectedThread.postCount} posts</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>{t('admin.pages.forum.cancel')}</Button>
            <Button variant="destructive" onClick={() => performAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" /> {t('admin.pages.forum.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
