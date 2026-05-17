'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
import {
  Search,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Plus,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import Link from 'next/link';
import { useT } from '@/i18n';

interface MangaData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  status: string;
  tags: string[];
  totalViews: number;
  rating: number | null;
  authorId: string;
  authorName: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
  };
  chapterCount: number;
  bookmarkCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MangaManagementPage() {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedManga, setSelectedManga] = useState<MangaData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/manga?page=${page}&status=${statusFilter}&search=${searchQuery}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const mangas = data?.mangas || [];
  const pagination = data?.pagination;

  const handleDelete = async () => {
    if (!selectedManga) return;

    try {
      const response = await fetch(`/api/admin/manga/${selectedManga.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await mutate();
        setShowDeleteDialog(false);
        setSelectedManga(null);
      }
    } catch (error) {
      console.error('Failed to delete manga:', error);
    }
  };

  const columns: ColumnDef<MangaData>[] = useMemo(
    () => [
      {
        accessorKey: 'manga',
        header: 'Manga',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-12 h-16 bg-[var(--surface-sunken)] rounded overflow-hidden flex-shrink-0">
              {row.original.coverUrl ? (
                <OptimizedImage
                  src={row.original.coverUrl}
                  alt={row.original.title}
                  width={48}
                  height={64}
                  className="rounded"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                {row.original.title}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                by {row.original.authorName}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {row.original.tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {row.original.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{row.original.tags.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'ONGOING'
                ? 'default'
                : row.original.status === 'COMPLETED'
                ? 'success'
                : 'secondary'
            }
            className="capitalize"
          >
            {row.original.status.toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'chapters',
        header: 'Chapters',
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">{row.original.chapterCount}</span>
          </div>
        ),
      },
      {
        accessorKey: 'stats',
        header: 'Stats',
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="text-[var(--text-muted)]">
              {row.original.totalViews.toLocaleString()} views
            </p>
            <p className="text-[var(--text-tertiary)]">
              {row.original.bookmarkCount} bookmarks
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
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
            <Link href={`/manga/${row.original.slug}`} target="_blank">
<Button variant="ghost" size="icon" title="View" aria-label="Ver manga">
            <Eye className="w-4 h-4 text-[var(--primary)]" />
          </Button>
            </Link>
            <Link href={`/admin/manga/${row.original.id}`}>
<Button variant="ghost" size="icon" title="Edit" aria-label="Editar manga">
            <Edit className="w-4 h-4 text-[var(--primary)]" />
          </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedManga(row.original);
                setShowDeleteDialog(true);
              }}
              title="Delete"
        aria-label="Eliminar manga"
            >
              <Trash2 className="w-4 h-4 text-[var(--error)]" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: mangas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.mangaManagement')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.manageAllManga')}</p>
        </div>
        <Link href="/creator/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('admin.addManga')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder={t('admin.searchManga')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('admin.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="HIATUS">Hiatus</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Manga Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.allManga')}{' '}
            <span className="text-[var(--text-tertiary)] font-normal">
              ({pagination?.total || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">
              {t('admin.failedToLoad')}
            </div>
          ) : mangas.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">{t('admin.noMangaFound')}</h3>
              <p className="text-[var(--text-tertiary)]">
                {searchQuery
                  ? t('admin.tryAdjustingFilters')
                  : t('admin.noMangaCreated')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-secondary)]"
                            onClick={header.column.getToggleSortingHandler()}
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

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-[var(--text-tertiary)]">
                    {t('admin.page')} {page} {t('admin.of')} {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.deleteManga')}</DialogTitle>
            <DialogDescription>
              {t('admin.deleteMangaDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedManga && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Manga:</p>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {selectedManga.title}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {selectedManga.chapterCount} chapters
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('admin.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('admin.deleteManga')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
