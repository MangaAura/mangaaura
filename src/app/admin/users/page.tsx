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
  Search,
  Users,
  Edit,
  Ban,
  Trash2,
  Eye,
  Shield,
  User,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  xpPoints: number;
  inkcoinsBalance: number;
  level: number;
  readingStreak: number;
  createdAt: string;
  lastReadAt: string | null;
  mangaCount: number;
  chapterCount: number;
  commentCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'delete'>('ban');
  const [isActioning, setIsActioning] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ users: UserData[] }>(
    '/api/admin/users',
    fetcher,
    {
      refreshInterval: 60000,
      onSuccess: (data) => {
        if (data?.users) {
          setUsers(data.users);
        }
      },
    }
  );

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
      console.error('Action failed:', error);
    } finally {
      setIsActioning(false);
    }
  };

  const columns: ColumnDef<UserData>[] = useMemo(
    () => [
      {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center overflow-hidden">
              {row.original.avatarUrl ? (
                <img
                  src={row.original.avatarUrl}
                  alt={row.original.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-[var(--text-tertiary)]" />
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">
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
            >
              <Eye className="w-4 h-4 text-[var(--primary)]" />
            </Button>
            <Link href={`/admin/users/${row.original.id}`}>
              <Button variant="ghost" size="icon" title="Edit">
                <Edit className="w-4 h-4 text-indigo-500" />
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
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.displayName && u.displayName.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--primary)]" />
            Users
          </h1>
          <p className="text-[var(--text-muted)]">Manage platform users</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users <span className="text-[var(--text-tertiary)] font-normal">({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">
              Failed to load users
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
                            className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)] cursor-pointer hover:text-slate-700"
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
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
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
              User Profile
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-[var(--text-tertiary)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
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
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedUser.xpPoints.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">XP Points</p>
                </div>
                <div className="bg-[var(--surface)] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedUser.inkcoinsBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">InkCoins</p>
                </div>
                <div className="bg-[var(--surface)] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedUser.readingStreak}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">Reading Streak</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">Email</span>
                  <span className="text-slate-900">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">Joined</span>
                  <span className="text-slate-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">Mangas Created</span>
                  <span className="text-slate-900">{selectedUser.mangaCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">Chapters Uploaded</span>
                  <span className="text-slate-900">{selectedUser.chapterCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-[var(--text-tertiary)]">Comments Posted</span>
                  <span className="text-slate-900">{selectedUser.commentCount}</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  Close
                </Button>
                <Link href={`/admin/users/${selectedUser.id}`}>
                  <Button>Edit User</Button>
                </Link>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'ban' && 'Ban User'}
              {actionType === 'unban' && 'Unban User'}
              {actionType === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'ban' && 'This will prevent the user from accessing the platform.'}
              {actionType === 'unban' && 'This will restore the user access to the platform.'}
              {actionType === 'delete' && 'This will permanently delete the user and all their data.'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-slate-700">User:</p>
              <p className="text-sm text-slate-900 mt-1">
                {selectedUser.displayName || selectedUser.username} (@{selectedUser.username})
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{selectedUser.email}</p>
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
              {actionType === 'ban' && (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </>
              )}
              {actionType === 'unban' && (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Unban User
                </>
              )}
              {actionType === 'delete' && (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
