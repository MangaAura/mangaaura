'use client';

import {
  Ban,
  Shield,
  Search,
  Loader2,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
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
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sanciones y Bloqueos | MangaAura',
  description: 'Gestiona las sanciones y bloqueos de usuarios en la plataforma MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sanciones y Bloqueos | MangaAura',
    description: 'Gestiona las sanciones y bloqueos de usuarios en la plataforma MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanciones y Bloqueos | MangaAura',
    description: 'Gestiona las sanciones en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/bans' },
};

interface BanUser {
  id: string;
  username: string;
  email: string;
}

interface BanEntry {
  id: string;
  userId: string | null;
  ipAddress: string | null;
  banType: string;
  reason: string;
  reasonDetail: string | null;
  isActive: boolean;
  issuedAt: string;
  expiresAt: string | null;
  liftedAt: string | null;
  user: BanUser | null;
  issuedBy: { username: string };
}

interface BansResponse {
  bans: BanEntry[];
}

interface UsersResponse {
  users: BanUser[];
}

const REASON_CATEGORIES = [
  'Spam',
  'Harassment',
  'Inappropriate Content',
  'Copyright Infringement',
  'Impersonation',
  'Bot/Automation',
  'Security Violation',
  'Terms of Service Violation',
  'Other',
];

function getBanTypeColor(type: string) {
  switch (type) {
    case 'PERMANENT':
      return 'destructive';
    case 'SUSPENSION':
      return 'warning';
    case 'IP_BAN':
      return 'default';
    default:
      return 'outline';
  }
}

export default function BansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLiftDialog, setShowLiftDialog] = useState<string | null>(null);
  const [liftReason, setLiftReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleError } = useErrorHandler();

  const [formData, setFormData] = useState({
    userId: '',
    banType: 'SUSPENSION',
    reason: '',
    reasonDetail: '',
    ipAddress: '',
    expiresAt: '',
  });

  const { data, error, isLoading, mutate } = useSWR<BansResponse>(
    '/api/admin/bans',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: usersData } = useSWR<UsersResponse>(
    showCreateDialog ? '/api/admin/users' : null,
    fetcher
  );

  const bans = data?.bans || [];

  const filteredBans = bans.filter((ban) => {
    if (filterType !== 'all' && ban.banType !== filterType) return false;
    if (filterActive !== 'all' && ban.isActive !== (filterActive === 'active')) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userMatch = ban.user && (ban.user.username.toLowerCase().includes(q) || ban.user.email.toLowerCase().includes(q));
      const ipMatch = ban.ipAddress?.toLowerCase().includes(q);
      const reasonMatch = ban.reason.toLowerCase().includes(q);
      if (!userMatch && !ipMatch && !reasonMatch) return false;
    }
    return true;
  });

  const handleCreateBan = async () => {
    if (!formData.reason) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        banType: formData.banType,
        reason: formData.reason,
        reasonDetail: formData.reasonDetail || undefined,
      };

      if (formData.banType === 'IP_BAN') {
        payload.ipAddress = formData.ipAddress;
      } else {
        payload.userId = formData.userId;
        if (formData.banType === 'SUSPENSION' && formData.expiresAt) {
          payload.expiresAt = formData.expiresAt;
        }
      }

      const res = await fetch('/api/admin/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await mutate();
        setShowCreateDialog(false);
        setFormData({
          userId: '',
          banType: 'SUSPENSION',
          reason: '',
          reasonDetail: '',
          ipAddress: '',
          expiresAt: '',
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Error creating ban');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiftBan = async (banId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bans/${banId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liftReason: liftReason || undefined }),
      });

      if (res.ok) {
        await mutate();
        setShowLiftDialog(null);
        setLiftReason('');
      } else {
        const err = await res.json();
        alert(err.error || 'Error lifting ban');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            Bans & Suspensions
          </h1>
          <p className="text-[var(--text-muted)]">Manage user bans, suspensions, and IP bans</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Ban
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search by user, IP, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Ban type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SUSPENSION">Suspension</SelectItem>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="IP_BAN">IP Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Lifted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Bans <span className="text-[var(--text-tertiary)] font-normal">({filteredBans.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load bans</div>
          ) : filteredBans.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[var(--success)]" />
              <p>No bans found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">User / IP</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Reason</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Issued By</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-tertiary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBans.map((ban) => (
                    <tr key={ban.id} className="border-b hover:bg-[var(--surface)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-[var(--warning)]" />
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {ban.user ? ban.user.username : ban.ipAddress || 'Unknown'}
                            </p>
                            {ban.user && (
                              <p className="text-xs text-[var(--text-tertiary)]">{ban.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getBanTypeColor(ban.banType)}>
                          {ban.banType.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-[var(--text-muted)]">{ban.reason}</p>
                        {ban.reasonDetail && (
                          <p className="text-xs text-[var(--text-tertiary)]">{ban.reasonDetail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-muted)]">{ban.issuedBy.username}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-tertiary)]">
                          {new Date(ban.issuedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ban.isActive ? (
                          <Badge variant="warning">
                            Active
                            {ban.expiresAt && ` (until ${new Date(ban.expiresAt).toLocaleDateString()})`}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Lifted {ban.liftedAt ? new Date(ban.liftedAt).toLocaleDateString() : ''}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ban.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLiftDialog(ban.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Lift
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Create New Ban
            </DialogTitle>
            <DialogDescription>
              Issue a ban, suspension, or IP ban to a user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ban Type</Label>
              <Select
                value={formData.banType}
                onValueChange={(v) => setFormData((p) => ({ ...p, banType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUSPENSION">Suspension (Temporary)</SelectItem>
                  <SelectItem value="PERMANENT">Permanent Ban</SelectItem>
                  <SelectItem value="IP_BAN">IP Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.banType === 'IP_BAN' ? (
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="e.g. 192.168.1.1"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData((p) => ({ ...p, ipAddress: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, userId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData?.users?.map((u: BanUser) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason Category</Label>
              <Select
                value={formData.reason}
                onValueChange={(v) => setFormData((p) => ({ ...p, reason: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REASON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detail (optional)</Label>
              <Textarea
                placeholder="Additional details about this ban..."
                value={formData.reasonDetail}
                onChange={(e) => setFormData((p) => ({ ...p, reasonDetail: e.target.value }))}
              />
            </div>

            {formData.banType === 'SUSPENSION' && (
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData((p) => ({ ...p, expiresAt: e.target.value }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateBan} disabled={isSubmitting || !formData.reason || (!formData.userId && formData.banType !== 'IP_BAN')}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Ban className="w-4 h-4 mr-2" />
              Issue Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showLiftDialog} onOpenChange={(o) => { if (!o) setShowLiftDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Lift Ban
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to lift this ban? The user will be able to access the platform again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Lift Reason (optional)</Label>
            <Textarea
              placeholder="Why is this ban being lifted?"
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLiftDialog(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={() => showLiftDialog && handleLiftBan(showLiftDialog)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              Lift Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
