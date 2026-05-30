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
  FileText,
  Trash2,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageIcon,
  ArrowUpDown,
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
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

interface MangaInfo {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
}

interface ChapterData {
  id: string;
  mangaId: string;
  manga: MangaInfo;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  viewCount: number;
  status: string;
  isCrowdfunded: boolean;
  crowdfundingGoal: number | null;
  crowdfundingCurrent: number | null;
  scheduledAt: string | null;
  commentCount: number;
  createdAt: string;
}

export default function ChapterManagementClient() {
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mangaFilter, setMangaFilter] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('chapterNumber');
  const [sortOrder, setSortOrder] = useState('asc');

  const { data, error, isLoading, mutate } = useSWR<{ chapters: ChapterData[]; pagination: { total: number; totalPages: number } }>(
    `/api/admin/chapters?page=${page}&search=${searchQuery}&status=${statusFilter}&mangaId=${mangaFilter}&sort=${sortBy}&order=${sortOrder}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: mangasData } = useSWR<{ mangas: { id: string; title: string }[] }>(
    '/api/admin/manga?limit=1000',
    fetcher
  );

  const chapters = data?.chapters || [];
  const pagination = data?.pagination;
  const mangas = mangasData?.mangas || [];

  const handleDelete = async () => {
    if (!selectedChapter) return;
    try {
      const response = await fetch(`/api/admin/chapters/${selectedChapter.id}`, { method: 'DELETE' });
      if (response.ok) {
        await mutate();
        setShowDeleteDialog(false);
        setSelectedChapter(null);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const columns: ColumnDef<ChapterData>[] = useMemo(() => [
    {
      id: 'drag',
      header: '',
      cell: () => <GripVertical className="w-4 h-4 text-[var(--text-tertiary)] cursor-grab" />,
    },
    {
      accessorKey: 'manga',
      header: 'Manga',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-[var(--surface-sunken)] rounded overflow-hidden flex-shrink-0">
            {row.original.manga.coverUrl ? (
              <img src={row.original.manga.coverUrl} alt={row.original.manga.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
            )}
          </div>
          <span className="font-medium text-sm truncate max-w-[150px]">{row.original.manga.title}</span>
        </div>
      ),
    },
    {
      accessorKey: 'chapterNumber',
      header: () => (
        <button onClick={() => { setSortBy('chapterNumber'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex items-center gap-1">
          Ch. <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => <span className="font-mono font-medium">#{row.original.chapterNumber}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--text-secondary)]">{row.original.title || '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'PUBLISHED' ? 'default' : 'secondary'} className="capitalize">
          {row.original.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'stats',
      header: 'Stats',
      cell: ({ row }) => (
        <div className="text-sm space-y-0.5">
          <p className="text-[var(--text-muted)]">{row.original.viewCount} views</p>
          <p className="text-[var(--text-tertiary)]">{row.original.totalPages} pages</p>
          <p className="text-[var(--text-tertiary)]">{row.original.commentCount} comments</p>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => (
        <button onClick={() => { setSortBy('createdAt'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex items-center gap-1">
          Created <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
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
        <div className="flex items-center gap-1">
          <Link href={`/manga/${row.original.manga.slug}/chapter/${row.original.chapterNumber}`} target="_blank">
            <Button variant="ghost" size="icon" title="View">
              <Eye className="w-4 h-4 text-[var(--primary)]" />
            </Button>
          </Link>
          <Link href={`/admin/chapters/${row.original.id}`}>
            <Button variant="ghost" size="icon" title="Edit">
              <Edit className="w-4 h-4 text-[var(--primary)]" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => { setSelectedChapter(row.original); setShowDeleteDialog(true); }} title="Delete">
            <Trash2 className="w-4 h-4 text-[var(--error)]" />
          </Button>
        </div>
      ),
    },
  ], [sortBy, sortOrder]);

  const table = useReactTable({
    data: chapters,
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
            <FileText className="w-6 h-6 text-[var(--primary)]" />
            Chapter Management
          </h1>
          <p className="text-[var(--text-muted)]">Manage all chapters across the platform</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Search chapters or manga..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={mangaFilter} onValueChange={(v) => { setMangaFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Manga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manga</SelectItem>
                {mangas.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Chapters{' '}
            <span className="text-[var(--text-tertiary)] font-normal">
              ({pagination?.total || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load chapters</div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">No chapters found</h3>
              <p className="text-[var(--text-tertiary)]">{searchQuery ? 'Try adjusting filters' : 'No chapters have been created yet'}</p>
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
                  <div className="text-sm text-[var(--text-tertiary)]">
                    Page {page} of {pagination.totalPages}
                  </div>
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              This will permanently delete this chapter and all associated comments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedChapter && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {selectedChapter.manga.title} — Chapter {selectedChapter.chapterNumber}
                {selectedChapter.title && `: ${selectedChapter.title}`}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {selectedChapter.totalPages} pages • {selectedChapter.viewCount} views
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
