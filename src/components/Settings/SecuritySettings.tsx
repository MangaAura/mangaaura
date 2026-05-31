'use client';

import { AlertCircle, Shield, Lock, Key, Smartphone, AlertTriangle, Check, Copy, Download, RefreshCw, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';


import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useT } from '@/i18n';
import { extractApiError } from '@/lib/extract-api-error';


const PATTERN_RULES = [
  { key: 'minLength', esKey: 'auth.validation.passwordMin' },
  { key: 'hasUpper', esKey: 'auth.validation.passwordUppercase' },
  { key: 'hasLower', esKey: 'auth.validation.passwordLowercase' },
  { key: 'hasNumber', esKey: 'auth.validation.passwordNumber' },
] as const;


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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [passwordPatterns, setPasswordPatterns] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

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
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [regenerateCooldown, setRegenerateCooldown] = useState(0);

  const t = useT();

  const validatePasswordPatterns = (password: string) => {
    setPasswordPatterns({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  };

  useEffect(() => {
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTwoFactorEnabled((session.user as any).twoFactorEnabled === true);
    }
  }, [session]);

  // Cooldown timers for resend and regenerate buttons
  useEffect(() => {
    if (resendCooldown <= 0 && regenerateCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
      setRegenerateCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown, regenerateCooldown]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: t('settings.security.passwordsDoNotMatch') });
      return;
    }

    const allPatternsMet = Object.values(passwordPatterns).every(Boolean);
    if (!allPatternsMet) {
      setMessage({ type: 'error', text: t('settings.security.passwordRequirements') });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setFieldErrors({});

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
        const { message, details } = await extractApiError(response);
        if (details?.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [field, errors] of Object.entries(details.fieldErrors)) {
            if (errors?.length) mapped[field] = errors[0];
          }
          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
            throw new Error(t('settings.security.fixFieldErrors'));
          }
        }
        throw new Error(message);
      }

      setMessage({ type: 'success', text: t('settings.security.passwordChanged') });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('settings.security.passwordError'),
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
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
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
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setVerificationToken('');
      await update({ twoFactorEnabled: true });
      setMessage({ type: 'success', text: t('settings.security.twoFactorActivated') });
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
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      setTwoFactorEnabled(false);
      setShowDisableConfirm(false);
      setDisablePassword('');
      setBackupCodes(null);
      await update({ twoFactorEnabled: false });
      setMessage({ type: 'success', text: t('settings.security.twoFactorDisabled') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setMessage({ type: 'success', text: t('settings.security.copied') });
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/verify/resend', {
        method: 'POST',
      });
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      setMessage({ type: 'success', text: t('settings.security.verificationResent') });
      setResendCooldown(60);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('settings.security.verificationError') });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setIsRegeneratingCodes(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/2fa/backup-codes', { method: 'POST' });
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setMessage({ type: 'success', text: t('settings.security.backupRegenerated') });
      setRegenerateCooldown(60);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error' });
    } finally {
      setIsRegeneratingCodes(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Verification Section */}
      {(session?.user as any)?.emailVerified === false && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('settings.security.verificationTitle')}</h2>
          </div>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--warning)]/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[var(--warning)]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">
                  {session?.user?.email || t('settings.security.verificationTitle')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--warning)]/10 text-[var(--warning)]">
                    {t('settings.security.notVerified')}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0}
                isLoading={isResendingVerification}
              >
                <Mail className="w-4 h-4 mr-1" />
                {resendCooldown > 0
                  ? `${t('settings.security.resendVerification')} (${resendCooldown}s)`
                  : t('settings.security.resendVerification')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('settings.security.changePasswordTitle')}</h2>
        </div>

        {message && (
          <Alert
            className={`mb-4 ${
              message.type === 'error'
                ? 'bg-[var(--error)]/10 border-[var(--error)]/20'
                : 'bg-[var(--success)]/10 border-[var(--success)]/20'
            }`}
          >
            {message.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0" aria-hidden="true" />
            )}
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
            <Label htmlFor="currentPassword">{t('settings.security.currentPassword')}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => {
                setPasswordData((p) => ({ ...p, currentPassword: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
              }}
              required
              autoComplete="current-password"
              className={fieldErrors.currentPassword ? 'border-[var(--error)]' : ''}
              aria-describedby={message?.type === 'error' ? 'password-change-error' : undefined}
            />
            {fieldErrors.currentPassword && (
              <p className="text-xs text-[var(--error)]">{fieldErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('settings.security.newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => {
                setPasswordData((p) => ({ ...p, newPassword: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                validatePasswordPatterns(e.target.value);
              }}
              required
              autoComplete="new-password"
              className={fieldErrors.newPassword ? 'border-[var(--error)]' : ''}
              aria-describedby={`new-password-hint${message?.type === 'error' ? ' password-change-error' : ''}`}
            />
            {fieldErrors.newPassword && (
              <p className="text-xs text-[var(--error)]">{fieldErrors.newPassword}</p>
            )}
            <ul id="new-password-hint" className="space-y-1" aria-label={t('settings.security.passwordRequirementsLabel')}>
              {PATTERN_RULES.map((rule) => {
                const met = passwordPatterns[rule.key as keyof typeof passwordPatterns];
                const Icon = met ? CheckCircle2 : XCircle;
                return (
                  <li key={rule.key} className="flex items-center gap-1.5 text-xs">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        met ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={met ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'}>
                      {t(rule.esKey)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('settings.security.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => {
                setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              required
              autoComplete="new-password"
              className={fieldErrors.confirmPassword ? 'border-[var(--error)]' : ''}
              aria-describedby={message?.type === 'error' ? 'password-change-error' : undefined}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-[var(--error)]">{fieldErrors.confirmPassword}</p>
            )}
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
            {t('settings.security.changePasswordButton')}
          </Button>
        </form>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[var(--success)]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('settings.security.sectionTitle')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--success)]/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-[var(--success)]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{t('settings.security.passwordSecure')}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{t('settings.security.passwordBcrypt')}</p>
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
                <p className="font-medium text-[var(--text-primary)]">{t('settings.security.twoFactorAuth')}</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {twoFactorEnabled ? t('settings.security.twoFactorEnabled') : t('settings.security.twoFactorDisabled')}
                </p>
              </div>
              {twoFactorEnabled ? (
                <Button variant="outline" size="sm" onClick={() => setShowDisableConfirm(true)}>
                  {t('settings.security.twoFactorDisable')}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handle2FASetup} isLoading={isLoading}>
                  {t('settings.security.twoFactorSetup')}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {show2FASetup && (
          <Card className="mt-4 p-6">
            <h3 className="text-lg font-semibold mb-4">{t('settings.security.setupTitle')}</h3>

            {/* Step 1: Scan QR code */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">1</span>
                <span className="font-medium text-sm">{t('settings.security.step1ScanQR')}</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mb-4 pl-8">
                {t('settings.security.step1Description')}
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
                    alt={t('settings.security.qrAlt')}
                    className="rounded-lg border border-[var(--border)]"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-2 text-center">{t('settings.security.qrFallback')}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`}
                      alt={t('settings.security.qrAlt')}
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-[var(--text-tertiary)]">
                {t('settings.security.orEnterManually')}{' '}
                <code className="text-[var(--primary)] font-mono text-xs break-all select-all">{twoFactorSecret}</code>
              </p>
            </div>

            {/* Step 2: Verify code */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">2</span>
                <span className="font-medium text-sm">{t('settings.security.step2Verify')}</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mb-4 pl-8">
                {t('settings.security.step2Description')}
              </p>
              <div className="pl-8 space-y-3">
                <Input
                  id="2fa-code"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('settings.security.placeholderCode')}
                  maxLength={6}
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  className="text-center text-lg tracking-[0.3em]"
                />
                <Button onClick={handle2FAVerify} disabled={verificationToken.length < 6} isLoading={isLoading}>
                  {t('settings.security.verifyAndActivate')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {backupCodes && (
          <Card className="mt-4 p-6 border-[var(--warning)]/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{t('settings.security.backupCodesTitle')}</h3>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              {t('settings.security.backupCodesDescription')}
            </p>
            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg font-mono text-sm mb-3 border border-[var(--border)]">
              {backupCodes.map((code, i) => (
                <div key={i} className="py-0.5 tracking-wider">{code}</div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                <Copy className="w-4 h-4 mr-1" /> {t('settings.security.copy')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'mangaaura-backup-codes.txt'; a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="w-4 h-4 mr-1" /> {t('settings.security.download')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateBackupCodes}
                isLoading={isRegeneratingCodes}
                disabled={regenerateCooldown > 0}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {regenerateCooldown > 0
                  ? `${t('settings.security.regenerate')} (${regenerateCooldown}s)`
                  : t('settings.security.regenerate')}
              </Button>
            </div>
          </Card>
        )}

        {showDisableConfirm && (
          <Card className="mt-4 p-6 border-[var(--error)]/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-[var(--error)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{t('settings.security.disableTitle')}</h3>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              {t('settings.security.disableDescription')}
            </p>
            <div className="space-y-3">
              <Input
                id="disable-2fa-password"
                type="password"
                placeholder={t('settings.security.currentPasswordPlaceholder')}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <Button onClick={handle2FADisable} disabled={!disablePassword} isLoading={isLoading}>
                  {t('settings.security.disableButton')}
                </Button>
                <Button variant="outline" onClick={() => { setShowDisableConfirm(false); setDisablePassword(''); }}>
                  {t('settings.security.cancel')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Alert className="mt-6 bg-[var(--warning)]/10 border-[var(--warning)]/20">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)]" aria-hidden="true" />
          <AlertDescription className="text-[var(--warning)]">
            {t('settings.security.securityRecommendation')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
