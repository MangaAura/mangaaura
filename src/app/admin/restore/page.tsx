'use client';

import { Loader2, RefreshCw, RotateCcw, Search, User } from 'lucide-react';
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
import { fetcher } from '@/lib/swr-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurar Usuarios | MangaAura',
  description: 'Restaura cuentas de usuario eliminadas en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Restaurar Usuarios | MangaAura',
    description: 'Restaura cuentas de usuario eliminadas en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restaurar Usuarios | MangaAura',
    description: 'Restaura cuentas de usuario en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/restore' },
};

export default function RestorePage() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [showDialog, setShowDialog] = useState(false);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-[var(--success)]" />
          Restaurar Cuentas
        </h1>
        <p className="text-[var(--text-muted)]">
          Restaura cuentas baneadas de usuarios.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Buscar por email, username o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Buscar usuario baneado"
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
              No hay usuarios baneados.
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[var(--success)]" />
              Restaurar Cuenta
            </DialogTitle>
            <DialogDescription>
              Esta acción restaurará la cuenta del usuario y levantará los baneos activos.
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
              Motivo de la restauración
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué se restaura esta cuenta..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleRestore} isLoading={isLoading}>
              {isLoading ? 'Restaurando...' : 'Restaurar Cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
