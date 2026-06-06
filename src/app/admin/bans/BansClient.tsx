'use client';

import {
  Ban,
  Shield,
  Search,
  Loader2,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
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
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

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
  pagination: { total: number; totalPages: number };
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
      return 'destructive' as const;
    case 'SUSPENSION':
      return 'warning' as const;
    case 'IP_BAN':
      return 'default' as const;
    default:
      return 'outline' as const;
  }
}

export default function BansClient() {
  const t = useT();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLiftDialog, setShowLiftDialog] = useState<string | null>(null);
  const [liftReason, setLiftReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    banType: 'SUSPENSION',
    reason: '',
    reasonDetail: '',
    ipAddress: '',
    expiresAt: '',
  });

  const { data, error, isLoading, mutate } = useSWR<BansResponse>(
    `/api/admin/bans?page=${page}&limit=20&type=${filterType}&active=${filterActive}&search=${searchQuery}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: usersData } = useSWR<UsersResponse>(
    showCreateDialog ? '/api/admin/users' : null,
    fetcher
  );

  const bans = data?.bans || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

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
        toast({
          title: 'Ban created',
          description: 'The ban has been issued successfully.',
          variant: 'success',
        });
      } else {
        const err = await res.json();
        toast({
          title: 'Error',
          description: err.error || 'Error creating ban',
          variant: 'error',
        });
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
        toast({
          title: 'Ban lifted',
          description: 'The ban has been lifted successfully.',
          variant: 'success',
        });
      } else {
        const err = await res.json();
        toast({
          title: 'Error',
          description: err.error || 'Error lifting ban',
          variant: 'error',
        });
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
            {t('admin.pages.bans.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.bans.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.pages.bans.newBan')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder={t('admin.pages.bans.search')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.pages.bans.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.pages.bans.allTypes')}</SelectItem>
                  <SelectItem value="SUSPENSION">Suspension</SelectItem>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="IP_BAN">IP Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterActive} onValueChange={(v) => { setFilterActive(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.pages.bans.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.pages.bans.allStatus')}</SelectItem>
                  <SelectItem value="active">{t('admin.pages.bans.active')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.pages.bans.lifted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.pages.bans.title')} <span className="text-[var(--text-tertiary)] font-normal">({pagination.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.bans.loadError')}</div>
          ) : bans.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[var(--success)]" />
              <p>{t('admin.pages.bans.empty')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.userIp')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.type')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.reason')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.issuedBy')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.date')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.status')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-tertiary)]">{t('admin.pages.bans.columns.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bans.map((ban) => (
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
                            <span className="text-xs text-[var(--text-tertiary)]">{ban.reasonDetail}</span>
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
                              {t('admin.pages.bans.active')}
                              {ban.expiresAt && ` (${t('admin.pages.bans.statusActive', { date: new Date(ban.expiresAt).toLocaleDateString() })})`}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t('admin.pages.bans.lifted')} {ban.liftedAt ? new Date(ban.liftedAt).toLocaleDateString() : ''}
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
                              {t('admin.pages.bans.actionLift')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-[var(--text-tertiary)]">
                    Page {page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              {t('admin.pages.bans.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.pages.bans.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.pages.bans.banType')}</Label>
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
                <Label>{t('admin.pages.bans.ipAddress')}</Label>
                <Input
                  placeholder={t('admin.pages.bans.ipPlaceholder')}
                  value={formData.ipAddress}
                  onChange={(e) => setFormData((p) => ({ ...p, ipAddress: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('admin.pages.bans.user')}</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, userId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.pages.bans.selectUser')} />
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
              <Label>{t('admin.pages.bans.reasonCategory')}</Label>
              <Select
                value={formData.reason}
                onValueChange={(v) => setFormData((p) => ({ ...p, reason: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.pages.bans.selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  {REASON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.pages.bans.detail')}</Label>
              <Textarea
                placeholder={t('admin.pages.bans.detailPlaceholder')}
                value={formData.reasonDetail}
                onChange={(e) => setFormData((p) => ({ ...p, reasonDetail: e.target.value }))}
              />
            </div>

            {formData.banType === 'SUSPENSION' && (
              <div className="space-y-2">
                <Label>{t('admin.pages.bans.expiresAt')}</Label>
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
              {t('admin.pages.bans.cancel')}
            </Button>
            <Button onClick={handleCreateBan} disabled={isSubmitting || !formData.reason || (!formData.userId && formData.banType !== 'IP_BAN')}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Ban className="w-4 h-4 mr-2" />
              {t('admin.pages.bans.issueBan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showLiftDialog} onOpenChange={(o) => { if (!o) setShowLiftDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {t('admin.pages.bans.liftTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.pages.bans.liftDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>{t('admin.pages.bans.liftReason')}</Label>
            <Textarea
              placeholder={t('admin.pages.bans.liftReasonPlaceholder')}
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLiftDialog(null)} disabled={isSubmitting}>
              {t('admin.pages.bans.cancel')}
            </Button>
            <Button
              onClick={() => showLiftDialog && handleLiftBan(showLiftDialog)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('admin.pages.bans.liftButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
