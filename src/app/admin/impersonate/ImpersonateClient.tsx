'use client';

import { Loader2, Search, User, ShieldAlert, AlertTriangle, History, Clock } from 'lucide-react';
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
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface ImpersonationLog {
  id: string;
  adminName: string;
  targetName: string;
  createdAt: string;
}

export default function ImpersonateClient() {
  const t = useT();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isValidating } = useSWR<{ users: Array<{ id: string; username: string; email: string }> }>(
    search.length >= 2 ? `/api/admin/users?search=${encodeURIComponent(search)}` : null,
    fetcher,
  );

  const { data: historyData } = useSWR<{ logs: ImpersonationLog[] }>(
    '/api/admin/impersonate/history',
    fetcher,
    { refreshInterval: 30000 },
  );

  const users = data?.users || [];
  const recentImpersonations = historyData?.logs || [];

  const handleImpersonate = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to impersonate');
      }

      const { redirectUrl } = await res.json();
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message);
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-[var(--warning)]" />
          {t('admin.pages.impersonate.title')}
        </h1>
        <p className="text-[var(--text-muted)]">
          {t('admin.pages.impersonate.subtitle')}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label={t('common.search')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isValidating ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center py-8 text-[var(--text-tertiary)]">
                {search.length < 2 ? t('common.search') + '...' : t('common.noResults')}
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
                        <User className="w-5 h-5 text-[var(--text-tertiary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{u.username}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{u.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(u);
                        setShowConfirm(true);
                      }}
                    >
                      Login as user
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent impersonations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentImpersonations.length === 0 ? (
              <p className="text-center py-8 text-[var(--text-tertiary)]">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No recent impersonations
              </p>
            ) : (
              <div className="space-y-2">
                {recentImpersonations.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-sunken)]">
                    <ShieldAlert className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {log.adminName} → {log.targetName}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">LOG</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              Confirm impersonation
            </DialogTitle>
            <DialogDescription>
              This action will be logged in the audit log with CRITICAL severity.
              All actions performed as this user will be visible.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="font-medium text-[var(--text-primary)]">{selectedUser.username}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{selectedUser.email}</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-[var(--error)]">{error}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleImpersonate} isLoading={isLoading}>
              {isLoading ? 'Impersonating...' : 'Yes, impersonate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
