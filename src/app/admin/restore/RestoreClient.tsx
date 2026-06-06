'use client';

import { AlertTriangle, Loader2, RefreshCw, RotateCcw, Search, User, Eye, Shield, Ban, Calendar } from 'lucide-react';
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
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

export default function RestoreClient() {
  const t = useT();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [previewUser, setPreviewUser] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isValidating, mutate } = useSWR<{ users: any[] }>(
    '/api/admin/users',
    fetcher,
  );

  const users = (data?.users || []).filter((u: any) => {
    const isDeletedOrBanned = u.role === 'BANNED';
    if (!search) return isDeletedOrBanned;
    const q = search.toLowerCase();
    return isDeletedOrBanned && (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const handleRestore = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, reason }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to restore');
      }

      await mutate();
      setShowDialog(false);
      setSelectedUser(null);
      setReason('');
      setConfirmText('');
      toast({ title: t('adminToasts.accountRestored'), description: `${selectedUser.username}`, variant: 'success' });
    } catch (err: any) {
      setError(err.message);
      toast({ title: t('adminToasts.restoreError'), description: err.message, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-[var(--success)]" />
          {t('admin.pages.restore.title')}
        </h1>
        <p className="text-[var(--text-muted)]">
          {t('admin.pages.restore.subtitle')}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder={t('admin.common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label={t('admin.common.search')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Usuarios Baneados{' '}
            <span className="text-[var(--text-tertiary)] font-normal">({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-[var(--text-tertiary)]">
              {t('admin.common.noData')}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Rol</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-tertiary)]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b hover:bg-[var(--surface)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
                            <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                          </div>
                          <span className="font-medium text-[var(--text-primary)]">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setPreviewUser(u); setShowPreview(true); }}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-[var(--primary)]" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDialog(true);
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Restaurar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--info)]" />
              Detalles del Usuario
            </DialogTitle>
          </DialogHeader>
          {previewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[var(--surface-sunken)] rounded-lg">
                <div className="w-14 h-14 rounded-full bg-[var(--surface)] flex items-center justify-center">
                  <User className="w-6 h-6 text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{previewUser.username}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{previewUser.email}</p>
                  <Badge variant="destructive" className="mt-1">{previewUser.role}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-[var(--surface-sunken)] rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1"><Calendar className="w-3 h-3" /> Creado</p>
                  <p className="font-medium text-[var(--text-primary)] mt-1">
                    {previewUser.createdAt ? new Date(previewUser.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--surface-sunken)] rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1"><Ban className="w-3 h-3" /> Estado</p>
                  <p className="font-medium text-[var(--error)] mt-1">Baneado</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            {previewUser && (
              <Button onClick={() => { setShowPreview(false); setSelectedUser(previewUser); setShowDialog(true); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Restaurar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog + Confirm Typing */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[var(--success)]" />
              Restaurar Cuenta
            </DialogTitle>
            <DialogDescription>
              {t('admin.restoreForm.restoreAction')}
              {' '}{t('admin.restoreForm.restoreConfirm')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-4">
              <p className="font-medium text-[var(--text-primary)]">{selectedUser.username}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{selectedUser.email}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              {t('admin.restoreForm.reason')}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.restoreForm.reasonPlaceholder')}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Escribe <span className="font-bold text-[var(--warning)]">RESTORE</span> para confirmar
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('admin.restoreForm.restoreConfirm')}
              className={confirmText === 'RESTORE' ? 'border-[var(--success)]' : ''}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setConfirmText(''); }} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleRestore}
              isLoading={isLoading}
              disabled={confirmText !== 'RESTORE'}
            >
              {isLoading ? 'Restaurando...' : 'Restaurar Cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
