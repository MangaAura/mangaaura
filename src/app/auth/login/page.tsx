'use client';

import { ArrowLeft, Mail, Lock, LogIn, Loader2, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import React, { useState, Suspense } from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

function LoadingSpinner({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex items-center justify-center" role="status">
      <div className="flex items-center gap-3 text-muted">
        <Loader2 size={24} className="animate-spin" />
        <span>{t('common.loading')}</span>
      </div>
    </div>
  );
}

function getErrorMessage(errorCode: string, t: (key: string) => string): { title: string; message: string; severity: 'error' | 'warning' } {
  const severities: Record<string, 'error' | 'warning'> = {
    OAuthCreateAccount: 'warning',
    OAuthAccountNotLinked: 'warning',
    SessionRequired: 'warning',
  };
  const titleKey = `auth.error.${errorCode}.title`;
  const messageKey = `auth.error.${errorCode}.message`;
  const title = t(titleKey);
  const message = t(messageKey);
  if (title !== titleKey) {
    return { title, message, severity: severities[errorCode] || 'error' };
  }
  return {
    title: t('auth.error.default.title'),
    message: t('auth.error.default.message'),
    severity: 'error',
  };
}

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; severity: 'error' | 'warning' } | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const t = useT();
  const emailErrorId = 'login-email-error';
  const passwordErrorId = 'login-password-error';
  const twoFAErrorId = 'login-2fa-error';

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const authError = searchParams.get('error');

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (authError) {
      setError(getErrorMessage(authError, t));
    }
  }, [authError, t]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const newFieldErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newFieldErrors.email = t('auth.validation.emailRequired');
    }
    if (!password) {
      newFieldErrors.password = t('auth.validation.passwordRequired');
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError({
        title: t('auth.requiredField'),
        message: Object.values(newFieldErrors).join('. '),
        severity: 'warning',
      });
      setIsLoading(false);
      return;
    }
    setFieldErrors({});

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        const errorInfo = getErrorMessage(result.error, t);
        setError(errorInfo);
        setFieldErrors({});
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        const updatedSession = await fetch('/api/auth/session').then(r => r.json());
        if (updatedSession?.user?.twoFactorPending) {
          setShow2FA(true);
          setIsLoading(false);
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError({
        title: t('errors.networkError'),
        message: t('errors.connectionFailed'),
        severity: 'error',
      });
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length < 6) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFactorCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Código inválido');
      }

      await update();
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError({
        title: 'Error de verificación',
        message: err instanceof Error ? err.message : 'Código inválido. Intenta de nuevo.',
        severity: 'error',
      });
      setTwoFactorCode('');
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    signIn(provider, { callbackUrl });
  };

  const inputBase = 'w-full pl-10 pr-4 py-3 bg-tertiary border-2 rounded-[8px] outline-none transition-all text-sm';
  const inputBorderNormal = 'border-custom focus:border-accent-blue focus:ring-[3px] focus:ring-[var(--accent-blue)]/20';
  const inputBorderError = 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[3px] focus:ring-[var(--error)]/20';

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[var(--surface)]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="fixed -top-40 -right-40 w-80 h-80 rounded-full bg-accent-blue/5 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-purple/5 blur-3xl pointer-events-none" />

      <header className="relative p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> {t('common.back')}
        </Link>
      </header>

      <main className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="text-center mb-8 [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            <h1 className="text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02em] mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-muted">{t('auth.loginSubtitle')}</p>
          </div>

          <div className="bg-[var(--surface-elevated)] rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
            {error && (
              <div className="mb-6 [animation:fadeSlideUp_0.3s_ease]">
                <ErrorMessage
                  title={error.title}
                  message={error.message}
                  severity={error.severity}
                  onDismiss={() => setError(null)}
                />
              </div>
            )}

            {show2FA ? (
              <form onSubmit={handle2FAVerify} className="space-y-5">
                <div className="text-center mb-4">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 text-accent-blue" />
                  <h2 className="text-xl font-bold mb-1">Verificación en dos pasos</h2>
                  <p className="text-sm text-muted">
                    Ingresa el código de 6 dígitos de tu aplicación de autenticación
                  </p>
                </div>
                <div>
                  <input
                    id="login-2fa-code"
                    type="text"
                    inputMode="numeric"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center text-2xl tracking-[0.5em] py-4 bg-tertiary border-2 rounded-[8px] outline-none transition-all border-custom focus:border-accent-blue focus:ring-[3px] focus:ring-[var(--accent-blue)]/20"
                    placeholder="000000"
                    maxLength={6}
                    disabled={isLoading}
                    autoFocus
                    aria-label="Código de verificación de 6 dígitos"
                    aria-required="true"
                    aria-invalid={!!error && show2FA}
                    aria-describedby={error && show2FA ? twoFAErrorId : undefined}
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="submit"
                  disabled={twoFactorCode.length < 6 || isLoading}
                  className="w-full bg-accent-blue hover:bg-accent-blue-hover active:scale-[0.98] text-[var(--text-inverse)] font-semibold py-[14px] rounded-[9999px] transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Verificando...</>
                  ) : (
                    <><Smartphone size={18} /> Verificar código</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShow2FA(false); setIsLoading(false); }}
                  className="w-full text-sm text-muted hover:text-fg-primary transition-colors"
                >
                  Volver al inicio de sesión
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold mb-2 text-fg-primary">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
                      className={cn(inputBase, fieldErrors.email ? inputBorderError : inputBorderNormal)}
                      placeholder="tu@email.com"
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                      aria-required="true"
                      autoComplete="email"
                    />
                    {fieldErrors.email && (
                      <span id={emailErrorId} className="text-xs text-[var(--error)] mt-1" role="alert">{fieldErrors.email}</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="login-password" className="text-sm font-semibold text-fg-primary">{t('auth.password')}</label>
                    <Link href="/auth/forgot-password" className="text-xs text-accent-blue hover:underline">
                      {t('auth.forgotPassword.link')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
                      className={cn(inputBase, fieldErrors.password ? inputBorderError : inputBorderNormal)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                      aria-required="true"
                      autoComplete="current-password"
                    />
                    {fieldErrors.password && (
                      <span id={passwordErrorId} className="text-xs text-[var(--error)] mt-1" role="alert">{fieldErrors.password}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent-blue hover:bg-accent-blue-hover active:scale-[0.98] text-[var(--text-inverse)] font-semibold py-[14px] rounded-[9999px] transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('auth.loggingIn')}
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> {t('auth.enter')}
                    </>
                  )}
                </button>
              </form>
            )}

            {!show2FA && (
              <>
                <div className="mt-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-custom after:h-px after:flex-1 after:bg-custom text-xs text-muted font-medium">
                  {t('auth.orContinueWith')}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={isLoading}
                    type="button"
                    className="flex items-center justify-center gap-2 bg-tertiary hover:bg-[var(--border-subtle)] active:scale-[0.98] border border-custom py-[10px] rounded-[9999px] text-sm font-semibold transition-all disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </button>
                  <button
                    onClick={() => handleOAuthSignIn('github')}
                    disabled={isLoading}
                    type="button"
                    className="flex items-center justify-center gap-2 bg-tertiary hover:bg-[var(--border-subtle)] active:scale-[0.98] border border-custom py-[10px] rounded-[9999px] text-sm font-semibold transition-all disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </button>
                </div>
              </>
            )}
          </div>

          {!show2FA && (
            <p className="text-center text-sm text-muted mt-8">
              {t('auth.noAccount')}{' '}
              <Link href="/auth/register" className="text-accent-blue font-semibold hover:underline">
                {t('auth.signUp')}
              </Link>
            </p>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const t = useT();
  return (
    <Suspense fallback={<LoadingSpinner t={t} />}>
      <Content />
    </Suspense>
  );
}
