'use client';

import { Shield, Lock, Key, Smartphone, AlertTriangle, Check, Copy, Download, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';


interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({}: SecuritySettingsProps) {
  const { data: session, update } = useSession();
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

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setTwoFactorEnabled((session.user as any).twoFactorEnabled === true);
    }
  }, [session]);

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

  const handle2FASetup = async () => {
    setIsLoading(true);
    setIsGeneratingQR(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      if (!response.ok) throw new Error('Error al iniciar configuración 2FA');
      const data = await response.json();
      setTwoFactorSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setShow2FASetup(true);

      // Generate QR code locally
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(data.otpauthUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrDataUrl(url);
      } catch {
        // Fallback: will render inline SVG
        setQrDataUrl('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error' });
    } finally {
      setIsLoading(false);
      setIsGeneratingQR(false);
    }
  };

  const handle2FAVerify = async () => {
    if (verificationToken.length < 6) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Código inválido');
      }
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setVerificationToken('');
      await update({ twoFactorEnabled: true });
      setMessage({ type: 'success', text: '2FA activado correctamente. ¡Guarda tus códigos de respaldo!' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!disablePassword) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: disablePassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al deshabilitar 2FA');
      }
      setTwoFactorEnabled(false);
      setShowDisableConfirm(false);
      setDisablePassword('');
      setBackupCodes(null);
      await update({ twoFactorEnabled: false });
      setMessage({ type: 'success', text: '2FA deshabilitado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setMessage({ type: 'success', text: 'Códigos copiados al portapapeles' });
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setIsRegeneratingCodes(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/2fa/backup-codes', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al regenerar códigos');
      }
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setMessage({ type: 'success', text: 'Códigos de respaldo regenerados correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error' });
    } finally {
      setIsRegeneratingCodes(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
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
              id="password-change-error"
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
              autoComplete="current-password"
              aria-describedby={message?.type === 'error' ? 'password-change-error' : undefined}
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
              autoComplete="new-password"
              aria-describedby={`new-password-hint${message?.type === 'error' ? ' password-change-error' : ''}`}
            />
            <p id="new-password-hint" className="text-xs text-[var(--text-tertiary)]">
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
              autoComplete="new-password"
              aria-describedby={message?.type === 'error' ? 'password-change-error' : undefined}
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
            <Key className="w-4 h-4 mr-2" aria-hidden="true" />
            Cambiar contraseña
          </Button>
        </form>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[var(--success)]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Seguridad de la cuenta</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--success)]/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-[var(--success)]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Contraseña segura</p>
                <p className="text-sm text-[var(--text-tertiary)]">Usa bcrypt con 12 rondas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                twoFactorEnabled ? 'bg-[var(--success)]/20' : 'bg-[var(--surface-sunken)]'
              }`}>
                <Smartphone className={`w-5 h-5 ${
                  twoFactorEnabled ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'
                }`} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">Autenticación de dos factores</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {twoFactorEnabled ? 'Configurada' : 'No configurada'}
                </p>
              </div>
              {twoFactorEnabled ? (
                <Button variant="outline" size="sm" onClick={() => setShowDisableConfirm(true)}>
                  Deshabilitar
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handle2FASetup} isLoading={isLoading}>
                  Configurar
                </Button>
              )}
            </div>
          </Card>
        </div>

        {show2FASetup && (
          <Card className="mt-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Configurar 2FA</h3>

            {/* Step 1: Scan QR code */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">1</span>
                <span className="font-medium text-sm">Escanea el código QR</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mb-4 pl-8">
                Abre tu aplicación de autenticación (Google Authenticator, Authy, etc.) y escanea este código:
              </p>
              <div className="flex justify-center mb-4">
                {isGeneratingQR ? (
                  <div className="w-[200px] h-[200px] bg-[var(--surface-sunken)] rounded-lg animate-pulse flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-[var(--text-tertiary)] animate-spin" />
                  </div>
                ) : qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="Código QR para 2FA"
                    className="rounded-lg border border-[var(--border)]"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-2 text-center">No se pudo generar el QR</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`}
                      alt="Código QR para 2FA"
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-[var(--text-tertiary)]">
                O ingresa manualmente:{' '}
                <code className="text-[var(--primary)] font-mono text-xs break-all select-all">{twoFactorSecret}</code>
              </p>
            </div>

            {/* Step 2: Verify code */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">2</span>
                <span className="font-medium text-sm">Verifica el código</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mb-4 pl-8">
                Ingresa el código de 6 dígitos que aparece en tu aplicación:
              </p>
              <div className="pl-8 space-y-3">
                <Input
                  id="2fa-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  className="text-center text-lg tracking-[0.3em]"
                />
                <Button onClick={handle2FAVerify} disabled={verificationToken.length < 6} isLoading={isLoading}>
                  Verificar y activar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {backupCodes && (
          <Card className="mt-4 p-6 border-[var(--warning)]/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Códigos de respaldo</h3>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              Guarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez y
              perderás acceso a tu cuenta si pierdes el acceso a tu aplicación de autenticación.
            </p>
            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg font-mono text-sm mb-3 border border-[var(--border)]">
              {backupCodes.map((code, i) => (
                <div key={i} className="py-0.5 tracking-wider">{code}</div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                <Copy className="w-4 h-4 mr-1" /> Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'inkverse-backup-codes.txt'; a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="w-4 h-4 mr-1" /> Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateBackupCodes}
                isLoading={isRegeneratingCodes}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Regenerar
              </Button>
            </div>
          </Card>
        )}

        {showDisableConfirm && (
          <Card className="mt-4 p-6 border-[var(--error)]/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-[var(--error)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Deshabilitar 2FA</h3>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              Ingresa tu contraseña para deshabilitar la autenticación de dos factores.
            </p>
            <div className="space-y-3">
              <Input
                id="disable-2fa-password"
                type="password"
                placeholder="Contraseña actual"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <Button onClick={handle2FADisable} disabled={!disablePassword} isLoading={isLoading}>
                  Deshabilitar 2FA
                </Button>
                <Button variant="outline" onClick={() => { setShowDisableConfirm(false); setDisablePassword(''); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Alert className="mt-6 bg-[var(--warning)]/10 border-[var(--warning)]/20">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)]" aria-hidden="true" />
          <AlertDescription className="text-[var(--warning)]">
            Por seguridad, te recomendamos cambiar tu contraseña cada 3 meses y activar 2FA
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
