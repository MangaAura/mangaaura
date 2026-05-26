'use client';

import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface AccountSettingsProps {
  userId: string;
}

export function AccountSettings(_props: AccountSettingsProps) {
  const [markedForDeletionAt, setMarkedForDeletionAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/delete-request');
      if (res.ok) {
        const data = await res.json();
        setMarkedForDeletionAt(data.markedForDeletionAt);
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleDeleteRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al solicitar eliminación');
      }
      const data = await res.json();
      setMarkedForDeletionAt(data.deletionDate);
      setShowConfirm(false);
      toast({
        title: 'Solicitud enviada',
        description: 'Recibirás un correo para confirmar la eliminación. Tienes 14 días para cancelar.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al solicitar eliminación',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cancelar eliminación');
      }
      setMarkedForDeletionAt(null);
      toast({
        title: 'Solicitud cancelada',
        description: 'Tu cuenta ya no está programada para eliminación.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cancelar eliminación',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletionDate = markedForDeletionAt
    ? new Date(markedForDeletionAt).toLocaleDateString()
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Cuenta
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Administra tu cuenta y datos personales
        </p>
      </div>

      <Card className={cn('p-6 border', markedForDeletionAt ? 'border-[var(--error)]/30' : 'border-[var(--border)]')}>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            markedForDeletionAt ? 'bg-[var(--error)]/20' : 'bg-[var(--surface-sunken)]'
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5',
              markedForDeletionAt ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--text-primary)] mb-1">
              Eliminar cuenta
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              {markedForDeletionAt
                ? `Has solicitado la eliminación de tu cuenta. Se eliminará el ${deletionDate}. Puedes cancelar esta solicitud en cualquier momento.`
                : 'Solicita la eliminación permanente de tu cuenta y todos tus datos. Esta acción tiene un período de gracia de 14 días.'}
            </p>

            {markedForDeletionAt ? (
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                isLoading={isLoading}
              >
                Cancelar eliminación
              </Button>
            ) : showConfirm ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteRequest}
                  isLoading={isLoading}
                >
                  Sí, eliminar mi cuenta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowConfirm(true)}
                className="text-[var(--error)] border-[var(--error)]/30 hover:bg-[var(--error)]/10"
              >
                Solicitar eliminación de cuenta
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
