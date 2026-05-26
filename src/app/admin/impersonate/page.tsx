'use client';

import { Loader2, Search, User, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

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
import { fetcher } from '@/lib/swr-config';

export default function ImpersonatePage() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isValidating } = useSWR<{ users: Array<{ id: string; username: string; email: string }> }>(
    search.length >= 2 ? `/api/admin/users?search=${encodeURIComponent(search)}` : null,
    fetcher,
  );

  const users = data?.users || [];

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-[var(--warning)]" />
          Impersonar Usuario
        </h1>
        <p className="text-[var(--text-muted)]">
          Inicia sesión como otro usuario para diagnosticar problemas.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Buscar por email o username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Buscar usuario"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-[var(--text-tertiary)]">
              {search.length < 2 ? 'Escribe al menos 2 caracteres' : 'No se encontraron usuarios'}
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

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              Confirmar Impersonación
            </DialogTitle>
            <DialogDescription>
              Esta acción quedará registrada en el registro de auditoría con severidad CRÍTICA.
              Todos los movimientos que realices como este usuario serán visibles.
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
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleImpersonate} isLoading={isLoading}>
              {isLoading ? 'Impersonando...' : 'Sí, impersonar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
