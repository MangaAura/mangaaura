'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Shield, Lock, Key, Smartphone, AlertTriangle, Check } from 'lucide-react';

interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({ userId }: SecuritySettingsProps) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cambiar contraseña',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Cambiar contraseña</h2>
        </div>

        {message && (
          <Alert
            className={`mb-4 ${
              message.type === 'error'
                ? 'bg-[var(--error)]/10 border-[var(--error)]/20'
                : 'bg-[var(--success)]/10 border-[var(--success)]/20'
            }`}
          >
            <AlertDescription
              className={
                message.type === 'error' ? 'text-[var(--error)]' : 'text-[var(--success)]'
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
              }
              required
            />
            <p className="text-xs text-[var(--text-tertiary)]">
              Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
              }
              required
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
          >
            <Key className="w-4 h-4 mr-2" />
            Cambiar contraseña
          </Button>
        </form>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[var(--success)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Seguridad de la cuenta</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--success)]/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Contraseña segura</p>
                <p className="text-sm text-[var(--text-tertiary)]">Último cambio: hace 30 días</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--surface-sunken)] rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[var(--text-tertiary)]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">Autenticación de dos factores</p>
                <p className="text-sm text-[var(--text-tertiary)]">No configurada</p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
          </Card>
        </div>

        <Alert className="mt-6 bg-[var(--warning)]/10 border-[var(--warning)]/20">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
          <AlertDescription className="text-[var(--warning)]">
            Por seguridad, te recomendamos cambiar tu contraseña cada 3 meses
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
