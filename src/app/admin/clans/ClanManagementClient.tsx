'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Search,
  Shield,
  Users,
  Trophy,
  Trash2,
  RotateCcw,
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

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

interface ClanLeader {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ClanData {
  id: string;
  name: string;
  description: string | null;
  emblemUrl: string | null;
  totalScore: number;
  monthlyScore: number;
  currentSeason: number;
  seasonStartDate: string;
  seasonEndDate: string | null;
  leader: ClanLeader | null;
  memberCount: number;
  createdAt: string;
}

export default function ClanManagementClient() {
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClan, setSelectedClan] = useState<ClanData | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; open: boolean }>({ type: '', open: false });

  const { data, error, isLoading, mutate } = useSWR<{ clans: ClanData[] }>(
    `/api/admin/clans?search=${searchQuery}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const clans = data?.clans || [];

  const performAction = async (action: string) => {
    if (!selectedClan) return;
    try {
      const response = await fetch(`/api/admin/clans/${selectedClan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        await mutate();
        setActionDialog({ type: '', open: false });
        setSelectedClan(null);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const columns: ColumnDef<ClanData>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Clan',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-sunken)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {row.original.emblemUrl ? (
              <img src={row.original.emblemUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Leader: {row.original.leader?.displayName || row.original.leader?.username || 'None'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'members',
      header: 'Members',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="font-medium">{row.original.memberCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalScore',
      header: 'Total Score',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-[var(--accent-orange)]" />
          <span className="font-mono font-medium">{row.original.totalScore.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'monthlyScore',
      header: 'Monthly',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.monthlyScore.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'currentSeason',
      header: 'Season',
      cell: ({ row }) => (
        <Badge variant="outline">S{row.original.currentSeason}</Badge>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedClan(row.original); setActionDialog({ type: 'resetScore', open: true }); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Score
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedClan(row.original); setActionDialog({ type: 'delete', open: true }); }}>
              <Trash2 className="w-4 h-4 mr-2 text-[var(--error)]" /> Delete Clan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({
    data: clans,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            Clan Management
          </h1>
          <p className="text-[var(--text-muted)]">Manage clans, reset scores, and moderate communities</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search clans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Clans{' '}
            <span className="text-[var(--text-tertiary)] font-normal">({clans.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load clans</div>
          ) : clans.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">No clans found</h3>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialog.type === 'resetScore'} onOpenChange={(o) => setActionDialog({ type: o ? 'resetScore' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Clan Score</DialogTitle>
            <DialogDescription>
              This will reset the clan&apos;s total and monthly scores to 0, start a new season, and reset all members&apos; contributed scores.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedClan && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="font-medium">{selectedClan.name}</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Score: {selectedClan.totalScore.toLocaleString()} | Season {selectedClan.currentSeason}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button onClick={() => performAction('resetScore')}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === 'delete'} onOpenChange={(o) => setActionDialog({ type: o ? 'delete' : '', open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Clan</DialogTitle>
            <DialogDescription>
              This will permanently delete the clan and all its memberships. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedClan && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="font-medium">{selectedClan.name}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{selectedClan.memberCount} members</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: '', open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => performAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Clan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
