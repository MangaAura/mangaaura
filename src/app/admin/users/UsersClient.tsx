'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Search,
  Users,
  Edit,
  Ban,
  Trash2,
  Eye,
  User,
  Check,
  Loader2,
  Coins,
  Zap,
  ArrowUp,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
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
import { Label } from '@/components/ui/Label';
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

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  level: number;
  xpPoints: number;
  auraBalance: number;
  avatarUrl?: string | null;
  displayName?: string | null;
  readingStreak: number;
  createdAt: string;
  mangaCount: number;
  chapterCount: number;
  commentCount: number;
}

const BAN_REASONS = [
  'Spam', 'Harassment', 'Inappropriate Content',
  'Copyright Infringement', 'Impersonation', 'Bot/Automation',
  'Security Violation', 'Terms of Service Violation', 'Other',
];

export default function UsersClient() {
  // Always call useT first before any conditional logic
  const t = useT();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'delete'>('ban');
  const [isActioning, setIsActioning] = useState(false);
  const [showAuraDialog, setShowAuraDialog] = useState(false);
  const [auraValue, setAuraValue] = useState(0);
  const [isSavingAura, setIsSavingAura] = useState(false);
  const [showXpDialog, setShowXpDialog] = useState(false);
  const [xpValue, setXpValue] = useState(0);
  const [isSavingXp, setIsSavingXp] = useState(false);
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [levelValue, setLevelValue] = useState(1);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleValue, setRoleValue] = useState('');
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkBanDialog, setShowBulkBanDialog] = useState(false);
  const [bulkBanType, setBulkBanType] = useState('SUSPENSION');
  const [bulkBanReason, setBulkBanReason] = useState('');
  const [bulkBanReasonDetail, setBulkBanReasonDetail] = useState('');
  const [isBulkBanning, setIsBulkBanning] = useState(false);
  const { toast } = useToast();

  const { data: _data, error, isLoading, mutate } = useSWR<{ users: UserData[] }>(
    '/api/admin/users',
    fetcher,
    { refreshInterval: 60000 }
  );

  const users = useMemo(() => _data?.users || [], [_data]);
  const filteredData = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === 'all' || u.role === roleFilter) &&
        (u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.displayName && u.displayName.toLowerCase().includes(query)))
    );
  }, [users, searchQuery, roleFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredData.length) return new Set();
      return new Set(filteredData.map((u) => u.id));
    });
  }, [filteredData]);

  const handleBulkBan = async () => {
    if (selectedIds.size === 0 || !bulkBanReason) return;
    setIsBulkBanning(true);
    try {
      const res = await fetch('/api/admin/bans/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedIds),
          banType: bulkBanType,
          reason: bulkBanReason,
          reasonDetail: bulkBanReasonDetail || undefined,
        }),
      });
      if (res.ok) {
        await mutate();
        setShowBulkBanDialog(false);
        setSelectedIds(new Set());
        setBulkBanReason('');
        setBulkBanReasonDetail('');
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Error creating bans', variant: 'destructive' });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsBulkBanning(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser) return;
    setIsActioning(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }),
      });

      if (response.ok) {
        await mutate();
        setShowActionDialog(false);
        setSelectedUser(null);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsActioning(false);
    }
  };

  const columns: ColumnDef<UserData>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={selectedIds.size > 0 && selectedIds.size === filteredData.length}
            ref={(el) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredData.length; }}
            onChange={toggleSelectAll}
            className="rounded border-[var(--border)]"
            aria-label={t('admin.common.all')}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            className="rounded border-[var(--border)]"
            aria-label={`${t('admin.common.select')} ${row.original.username}`}
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center overflow-hidden">
              {row.original.avatarUrl ? (
                <OptimizedImage
                  src={row.original.avatarUrl}
                  alt={row.original.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                  objectFit="cover"
                />
              ) : (
                <User className="w-5 h-5 text-[var(--text-tertiary)]" />
              )}
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {row.original.displayName || row.original.username}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">@{row.original.username}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-[var(--text-muted)]">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge
            variant={row.original.role === 'ADMIN' ? 'destructive' : 'default'}
            className="capitalize"
          >
            {row.original.role.toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">{row.original.level}</span>
          </div>
        ),
      },
      {
        accessorKey: 'xpPoints',
        header: 'XP',
        cell: ({ row }) => (
          <span className="text-sm text-[var(--text-muted)]">
            {row.original.xpPoints.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setShowUserDialog(true);
              }}
              title="View Profile"
        aria-label={t('admin.common.view')}
            >
              <Eye className="w-4 h-4 text-[var(--primary)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setAuraValue(row.original.auraBalance);
                setShowAuraDialog(true);
              }}
              title="Adjust Aura"
              aria-label="Adjust Aura"
            >
              <Coins className="w-4 h-4 text-amber-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setXpValue(row.original.xpPoints);
                setShowXpDialog(true);
              }}
              title="Adjust XP"
              aria-label="Adjust XP"
            >
              <Zap className="w-4 h-4 text-purple-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setLevelValue(row.original.level);
                setShowLevelDialog(true);
              }}
              title="Adjust Level"
              aria-label="Adjust Level"
            >
              <ArrowUp className="w-4 h-4 text-emerald-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setRoleValue(row.original.role);
                setShowRoleDialog(true);
              }}
              title="Change Role"
              aria-label="Change Role"
            >
              <Shield className="w-4 h-4 text-blue-500" />
            </Button>
            <Link href={`/admin/users/${row.original.id}`}>
<Button variant="ghost" size="icon" title="Edit" aria-label={t('admin.common.edit')}>
            <Edit className="w-4 h-4 text-[var(--primary)]" />
          </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setActionType('ban');
                setShowActionDialog(true);
              }}
              title="Ban User"
        aria-label={t('admin.common.ban')}
            >
              <Ban className="w-4 h-4 text-[var(--warning)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedUser(row.original);
                setActionType('delete');
                setShowActionDialog(true);
              }}
              title="Delete"
        aria-label={t('admin.common.delete')}
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
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.users')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.managePlatformUsers')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-[var(--text-tertiary)]">
                {selectedIds.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setBulkBanType('SUSPENSION');
                  setBulkBanReason('');
                  setShowBulkBanDialog(true);
                }}
              >
                <Ban className="w-4 h-4 mr-1" />
                Ban Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder={t('admin.searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label={t('admin.searchUsers')}
            />
          </div>

          {/* Role filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Role:
            </span>
            {[
              { value: 'all', label: 'All' },
              { value: 'USER', label: 'User' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'BANNED', label: 'Banned' },
            ].map((role) => (
              <button
                key={role.value}
                onClick={() => setRoleFilter(role.value)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  roleFilter === role.value
                    ? role.value === 'ADMIN'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : role.value === 'BANNED'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30'
                    : 'bg-[var(--surface)] text-[var(--text-tertiary)] border border-[var(--border)] hover:text-[var(--text-secondary)] hover:border-[var(--border)]/80'
                }`}
                aria-pressed={roleFilter === role.value}
              >
                {role.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.allUsers')} <span className="text-[var(--text-tertiary)] font-normal">({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12" role="status">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">
              {t('admin.failedToLoad')}
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
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-[var(--text-tertiary)]">
                  {t('admin.page')} {table.getState().pagination.pageIndex + 1} {t('admin.of')}{' '}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Profile Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('admin.userProfile')}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <OptimizedImage
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.username}
                      width={64}
                      height={64}
                      className="rounded-full"
                      objectFit="cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-[var(--text-tertiary)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {selectedUser.displayName || selectedUser.username}
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)]">@{selectedUser.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={selectedUser.role === 'ADMIN' ? 'destructive' : 'default'}
                    >
                      {selectedUser.role}
                    </Badge>
                    <Badge variant="outline">Level {selectedUser.level}</Badge>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--surface)] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedUser.xpPoints.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">{t('admin.xpPoints')}</p>
                </div>
                <div className="bg-[var(--surface)] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedUser.auraBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">{t('admin.aura')}</p>
                </div>
                <div className="bg-[var(--surface)] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedUser.readingStreak}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">{t('admin.readingStreak')}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">Email</span>
                  <span className="text-[var(--text-primary)]">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">{t('admin.joined')}</span>
                  <span className="text-[var(--text-primary)]">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">{t('admin.mangasCreated')}</span>
                  <span className="text-[var(--text-primary)]">{selectedUser.mangaCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">{t('admin.chaptersUploaded')}</span>
                  <span className="text-[var(--text-primary)]">{selectedUser.chapterCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">{t('admin.commentsPosted')}</span>
                  <span className="text-[var(--text-primary)]">{selectedUser.commentCount}</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  {t('admin.close')}
                </Button>
                <Link href={`/admin/users/${selectedUser.id}`}>
                  <Button>{t('admin.editUser')}</Button>
                </Link>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Ban Dialog */}
      <Dialog open={showBulkBanDialog} onOpenChange={setShowBulkBanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Ban {selectedIds.size} Users
            </DialogTitle>
            <DialogDescription>
              Apply a ban to all selected users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ban Type</Label>
              <Select value={bulkBanType} onValueChange={setBulkBanType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUSPENSION">Suspension (Temporary)</SelectItem>
                  <SelectItem value="PERMANENT">Permanent Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason Category</Label>
              <Select value={bulkBanReason} onValueChange={setBulkBanReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {BAN_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detail (optional)</Label>
              <Textarea
                placeholder="Additional details..."
                value={bulkBanReasonDetail}
                onChange={(e) => setBulkBanReasonDetail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkBanDialog(false)} disabled={isBulkBanning}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkBan}
              disabled={isBulkBanning || !bulkBanReason}
            >
              {isBulkBanning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Ban className="w-4 h-4 mr-2" />
              Ban {selectedIds.size} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aura Adjustment Dialog */}
      <Dialog open={showAuraDialog} onOpenChange={setShowAuraDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Adjust Aura Balance
            </DialogTitle>
            <DialogDescription>
              Set a new Aura balance for {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="bg-[var(--surface)] p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Current balance</p>
                <p className="text-2xl font-bold text-amber-500">
                  {selectedUser.auraBalance.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aura-amount">New Aura Balance</Label>
                <Input
                  id="aura-amount"
                  type="number"
                  min={0}
                  value={auraValue}
                  onChange={(e) => setAuraValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-lg font-bold text-center"
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  {auraValue > selectedUser.auraBalance
                    ? `Will add ${(auraValue - selectedUser.auraBalance).toLocaleString()} Aura`
                    : auraValue < selectedUser.auraBalance
                      ? `Will remove ${(selectedUser.auraBalance - auraValue).toLocaleString()} Aura`
                      : 'No change'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuraDialog(false)} disabled={isSavingAura}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;
                setIsSavingAura(true);
                try {
                  const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auraBalance: auraValue }),
                  });
                  if (res.ok) {
                    await mutate();
                    setShowAuraDialog(false);
                    toast({
                      title: 'Aura updated',
                      description: `${selectedUser.username} now has ${auraValue.toLocaleString()} Aura`,
                      variant: 'success',
                    });
                  } else {
                    const err = await res.json();
                    toast({
                      title: 'Error',
                      description: err.error || 'Failed to update Aura',
                      variant: 'error',
                    });
                  }
                } catch {
                  toast({
                    title: 'Error',
                    description: 'Connection error',
                    variant: 'error',
                  });
                } finally {
                  setIsSavingAura(false);
                }
              }}
              disabled={isSavingAura || auraValue === selectedUser?.auraBalance}
            >
              {isSavingAura && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Coins className="w-4 h-4 mr-2 text-amber-400" />
              Save Aura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XP Adjustment Dialog */}
      <Dialog open={showXpDialog} onOpenChange={setShowXpDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Adjust XP Points
            </DialogTitle>
            <DialogDescription>
              Set new XP points for {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="bg-[var(--surface)] p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Current XP</p>
                <p className="text-2xl font-bold text-purple-500">
                  {selectedUser.xpPoints.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="xp-amount">New XP Points</Label>
                <Input
                  id="xp-amount"
                  type="number"
                  min={0}
                  value={xpValue}
                  onChange={(e) => setXpValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-lg font-bold text-center"
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  {xpValue > selectedUser.xpPoints
                    ? `Will add ${(xpValue - selectedUser.xpPoints).toLocaleString()} XP`
                    : xpValue < selectedUser.xpPoints
                      ? `Will remove ${(selectedUser.xpPoints - xpValue).toLocaleString()} XP`
                      : 'No change'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowXpDialog(false)} disabled={isSavingXp}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;
                setIsSavingXp(true);
                try {
                  const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xpPoints: xpValue }),
                  });
                  if (res.ok) {
                    await mutate();
                    setShowXpDialog(false);
                    toast({
                      title: 'XP updated',
                      description: `${selectedUser.username} now has ${xpValue.toLocaleString()} XP`,
                      variant: 'success',
                    });
                  } else {
                    const err = await res.json();
                    toast({
                      title: 'Error',
                      description: err.error || 'Failed to update XP',
                      variant: 'error',
                    });
                  }
                } catch {
                  toast({
                    title: 'Error',
                    description: 'Connection error',
                    variant: 'error',
                  });
                } finally {
                  setIsSavingXp(false);
                }
              }}
              disabled={isSavingXp || xpValue === selectedUser?.xpPoints}
            >
              {isSavingXp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Zap className="w-4 h-4 mr-2 text-purple-400" />
              Save XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Adjustment Dialog */}
      <Dialog open={showLevelDialog} onOpenChange={setShowLevelDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-emerald-500" />
              Adjust Level
            </DialogTitle>
            <DialogDescription>
              Set a new level for {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="bg-[var(--surface)] p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Current Level</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {selectedUser.level}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level-amount">New Level</Label>
                <Input
                  id="level-amount"
                  type="number"
                  min={1}
                  value={levelValue}
                  onChange={(e) => setLevelValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-lg font-bold text-center"
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  {levelValue > selectedUser.level
                    ? `Will increase by ${levelValue - selectedUser.level} levels`
                    : levelValue < selectedUser.level
                      ? `Will decrease by ${selectedUser.level - levelValue} levels`
                      : 'No change'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLevelDialog(false)} disabled={isSavingLevel}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;
                setIsSavingLevel(true);
                try {
                  const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level: levelValue }),
                  });
                  if (res.ok) {
                    await mutate();
                    setShowLevelDialog(false);
                    toast({
                      title: 'Level updated',
                      description: `${selectedUser.username} is now level ${levelValue}`,
                      variant: 'success',
                    });
                  } else {
                    const err = await res.json();
                    toast({
                      title: 'Error',
                      description: err.error || 'Failed to update level',
                      variant: 'error',
                    });
                  }
                } catch {
                  toast({
                    title: 'Error',
                    description: 'Connection error',
                    variant: 'error',
                  });
                } finally {
                  setIsSavingLevel(false);
                }
              }}
              disabled={isSavingLevel || levelValue === selectedUser?.level}
            >
              {isSavingLevel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <ArrowUp className="w-4 h-4 mr-2 text-emerald-400" />
              Save Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Adjustment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Change Role
            </DialogTitle>
            <DialogDescription>
              Set a new role for {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="bg-[var(--surface)] p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Current Role</p>
                <p className="text-2xl font-bold text-blue-500 capitalize">
                  {selectedUser.role.toLowerCase()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-select">New Role</Label>
                <Select value={roleValue} onValueChange={setRoleValue}>
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {roleValue !== selectedUser.role
                    ? `Will change from ${selectedUser.role.toLowerCase()} to ${roleValue.toLowerCase()}`
                    : 'No change'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} disabled={isSavingRole}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;
                setIsSavingRole(true);
                try {
                  const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: roleValue }),
                  });
                  if (res.ok) {
                    await mutate();
                    setShowRoleDialog(false);
                    toast({
                      title: 'Role updated',
                      description: `${selectedUser.username} is now ${roleValue.toLowerCase()}`,
                      variant: 'success',
                    });
                  } else {
                    const err = await res.json();
                    toast({
                      title: 'Error',
                      description: err.error || 'Failed to update role',
                      variant: 'error',
                    });
                  }
                } catch {
                  toast({
                    title: 'Error',
                    description: 'Connection error',
                    variant: 'error',
                  });
                } finally {
                  setIsSavingRole(false);
                }
              }}
              disabled={isSavingRole || roleValue === selectedUser?.role}
            >
              {isSavingRole && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Shield className="w-4 h-4 mr-2 text-blue-400" />
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'ban' && t('admin.banUser')}
              {actionType === 'unban' && t('admin.unbanUser')}
              {actionType === 'delete' && t('admin.deleteUser')}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'ban' && t('admin.banUserDesc')}
              {actionType === 'unban' && t('admin.unbanUserDesc')}
              {actionType === 'delete' && t('admin.deleteUserDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">User:</p>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {selectedUser.displayName || selectedUser.username} (@{selectedUser.username})
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{selectedUser.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={isActioning}>
              {t('admin.cancel')}
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={isActioning}
            >
              {isActioning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === 'ban' && (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  {t('admin.banUser')}
                </>
              )}
              {actionType === 'unban' && (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('admin.unbanUser')}
                </>
              )}
              {actionType === 'delete' && (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('admin.deleteUser')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
