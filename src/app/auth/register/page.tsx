'use client';

import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import React, { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { getAuthErrorMessage, getRegisterApiErrorMessage } from '@/lib/auth-errors';
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

function createRegisterSchemas(t: (key: string) => string) {
  const base = z.object({
    username: z
      .string()
      .min(3, t('auth.validation.usernameMin'))
      .max(30, t('auth.validation.usernameMax'))
      .regex(/^[a-zA-Z0-9_]+$/, t('auth.validation.usernamePattern')),
    email: z.string().email(t('auth.validation.emailInvalid')),
    password: z
      .string()
      .min(8, t('auth.validation.passwordMin'))
      .regex(/[A-Z]/, t('auth.validation.passwordUppercase'))
      .regex(/[a-z]/, t('auth.validation.passwordLowercase'))
      .regex(/[0-9]/, t('auth.validation.passwordNumber')),
    confirmPassword: z.string(),
  });
  const register = base.refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordMismatch'),
    path: ['confirmPassword'],
  });
  return { baseSchema: base, registerSchema: register };
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [authError, setAuthError] = useState<{ title: string; message: string; severity: 'error' | 'warning' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [idPrefix] = useState(() => `register-${Math.random().toString(36).substr(2, 6)}`);
  const usernameErrorId = `${idPrefix}-username-error`;
  const emailErrorId = `${idPrefix}-email-error`;
  const passwordErrorId = `${idPrefix}-password-error`;
  const confirmPasswordErrorId = `${idPrefix}-confirm-password-error`;
  const t = useT();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { baseSchema, registerSchema } = useMemo(() => createRegisterSchemas(t), [t]);
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced async check for username availability
  const checkUsername = (value: string) => {
    if (usernameCheckTimerRef.current) {
      clearTimeout(usernameCheckTimerRef.current);
    }

    // Abort any in-flight request to prevent race conditions on rapid typing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset to unknown if value is empty or invalid
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    usernameCheckTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setUsernameChecking(true);
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          // Only update state if this request wasn't aborted
          if (!controller.signal.aborted) {
            setUsernameAvailable(data.available);
            if (!data.available) {
              setErrors((prev) => ({ ...prev, username: t('auth.validation.usernameTaken') }));
            }
          }
        }
      } catch (err: unknown) {
        // Silently ignore aborted requests; fail gracefully on network errors
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setUsernameAvailable(null);
      } finally {
        if (!controller.signal.aborted) {
          setUsernameChecking(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, 500);
  };

  // Fetch available OAuth providers from NextAuth so buttons are only shown
  // when the provider is actually configured server-side.
  useEffect(() => {
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(data => setOauthProviders(Object.keys(data)))
      .catch(() => setOauthProviders([]));
  }, []);

  const handleOAuthSignIn = (provider: 'google' | 'github') => {
    setIsLoading(true);
    setAuthError(null);
    signIn(provider, { callbackUrl });
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: '', score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { label: '', color: 'bg-[var(--border)]' },
{ label: t('auth.passwordStrength.weak'), color: 'bg-[var(--error)]' },
    { label: t('auth.passwordStrength.fair'), color: 'bg-[var(--accent-orange)]' },
  { label: t('auth.passwordStrength.good'), color: 'bg-[var(--warning)]' },
  { label: t('auth.passwordStrength.strong'), color: 'bg-[var(--success)]' },
  { label: t('auth.passwordStrength.veryStrong'), color: 'bg-[var(--success)]' },
    ];

    return { ...levels[score], score };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const validated = registerSchema.safeParse(formData);

      if (!validated.success) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {};
        const zodError = validated.error;
        zodError.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as keyof FormData] = issue.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific API error
        const apiError = getRegisterApiErrorMessage(data.error || '', t);
        setAuthError(apiError);
        setIsLoading(false);
        return;
      }

      toast({ title: t('auth.accountCreated'), variant: 'default' });

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      // Auth.js v5: signIn returns SignInResponse object, ok=true on success
      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else if (result?.error) {
        // Show specific signIn error (e.g. CredentialsSignin, Configuration)
        const signInError = getAuthErrorMessage(result.error, t);
        setAuthError({
          ...signInError,
          message: t('auth.accountCreatedWarning') || signInError.message,
        });
        setIsLoading(false);
        // Redirect to login after short delay since account was created
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = setTimeout(() => router.push('/auth/login?registered=true'), 3000);
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch (err: unknown) {
      setAuthError({
        title: t('errors.networkError'),
        message: err instanceof Error ? err.message : t('errors.connectionFailed'),
        severity: 'error',
      });
      setIsLoading(false);
    }
  };

  // Cleanup timers and abort controller on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const validateField = (field: keyof FormData, value: string) => {
    if (field === 'username') {
      // Run sync validation first
      const fieldSchema = baseSchema.shape.username;
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        setErrors((prev) => ({ ...prev, username: result.error!.issues[0].message }));
        setUsernameAvailable(null);
      } else {
        setErrors((prev) => ({ ...prev, username: '' }));
        // Trigger async availability check
        checkUsername(value);
      }
      return;
    }

    if (field === 'confirmPassword') {
      if (!value) {
        setErrors((prev) => ({ ...prev, confirmPassword: t('auth.validation.confirmPasswordRequired') }));
      } else if (value !== formData.password) {
        setErrors((prev) => ({ ...prev, confirmPassword: t('auth.validation.passwordMismatch') }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
      return;
    }

    const fieldSchema = baseSchema.shape[field as keyof typeof baseSchema.shape];
    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: result.error!.issues[0].message }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const inputBase = 'w-full pl-10 pr-4 py-3 bg-tertiary border-2 rounded-[8px] outline-none transition-all text-sm';
  const inputBorderNormal = 'border-custom focus:border-accent-blue focus:ring-[3px] focus:ring-[var(--accent-blue)]/20';
  const inputBorderError = 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[3px] focus:ring-[var(--error)]/20';
  const inputBorderSuccess = 'border-[var(--success)] focus:border-[var(--success)] focus:ring-[3px] focus:ring-[var(--success)]/20';

  return (
    <div className="flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> {t('common.back')}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="text-center mb-8 [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            <h1 className="text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02em] mb-2">{t('auth.registerTitle')}</h1>
            <p className="text-muted">{t('auth.registerSubtitle')}</p>
          </div>

          <div className="bg-[var(--surface-elevated)] rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
            {authError && (
              <div className="mb-6 [animation:fadeSlideUp_0.3s_ease]">
                <ErrorMessage
                  title={authError.title}
                  message={authError.message}
                  severity={authError.severity}
                  onDismiss={() => setAuthError(null)}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="register-username" className="block text-sm font-semibold mb-2 text-fg-primary">{t('auth.username')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    id="register-username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({ ...prev, username: e.target.value }));
                      validateField('username', e.target.value);
                    }}
                    className={cn(
                      inputBase,
                      'pr-10',
                      errors.username ? inputBorderError
                        : usernameAvailable === true && !errors.username ? inputBorderSuccess
                        : formData.username && !errors.username ? inputBorderNormal
                        : inputBorderNormal
                    )}
                    placeholder="usuario123"
                    disabled={isLoading}
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? usernameErrorId : undefined}
                    aria-required="true"
                    autoComplete="username"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {usernameChecking && (
                      <>
                        <span className="text-xs text-muted">{t('auth.validation.usernameChecking')}</span>
                        <Loader2 size={18} className="animate-spin text-muted" />
                      </>
                    )}
                    {!usernameChecking && usernameAvailable === true && !errors.username && (
                      <CheckCircle2 size={18} className="text-[var(--success)]" />
                    )}
                    {!usernameChecking && usernameAvailable === false && (
                      <XCircle size={18} className="text-[var(--error)]" />
                    )}
                  </span>
</div>
{usernameAvailable === true && !errors.username && formData.username.length >= 3 && (
  <div className="mt-2 flex items-start gap-2 p-2 bg-[var(--success)]/10 rounded-lg">
    <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
    <p className="text-sm font-medium text-[var(--success)]">{t('auth.validation.usernameAvailable')}</p>
  </div>
)}
{errors.username && (
                  <div id={usernameErrorId} className="mt-2">
                    <ErrorMessage message={errors.username} />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-semibold mb-2 text-fg-primary">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    id="register-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({ ...prev, email: e.target.value }));
                      validateField('email', e.target.value);
                    }}
                    className={cn(
                      inputBase,
                      errors.email ? inputBorderError
                        : formData.email && !errors.email ? inputBorderSuccess
                        : inputBorderNormal
                    )}
                    placeholder="tu@email.com"
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? emailErrorId : undefined}
                    aria-required="true"
                    autoComplete="email"
                  />
                  {formData.email && !errors.email && (
<CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]" size={18} />
)}
</div>
{errors.email && (
                  <div id={emailErrorId} className="mt-2">
                    <ErrorMessage message={errors.email} />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-semibold mb-2 text-fg-primary">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({ ...prev, password: e.target.value }));
                      validateField('password', e.target.value);
                    }}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 bg-tertiary border-2 rounded-[8px] outline-none transition-all text-sm',
                      errors.password ? inputBorderError : inputBorderNormal
                    )}
                    placeholder="••••••••"
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? passwordErrorId : undefined}
                    aria-required="true"
                    autoComplete="new-password"
                  /><button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-fg-primary transition-colors rounded-[8px] hover:bg-[var(--border-subtle)]"
  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
>
  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
</button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-[3px] h-[6px]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-full transition-all duration-300',
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-[var(--border)]'
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {t('auth.passwordStrengthLabel')} <span className={cn('font-medium', passwordStrength.color.replace('bg-', 'text-'))}>
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
                {errors.password && (
                  <div id={passwordErrorId} className="mt-2">
                    <ErrorMessage message={errors.password} />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-semibold mb-2 text-fg-primary">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({ ...prev, confirmPassword: e.target.value }));
                      validateField('confirmPassword', e.target.value);
                    }}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 bg-tertiary border-2 rounded-[8px] outline-none transition-all text-sm',
                      errors.confirmPassword ? inputBorderError : inputBorderNormal
                    )}
                    placeholder="••••••••"
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? confirmPasswordErrorId : undefined}
                    aria-required="true"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-fg-primary transition-colors rounded-[8px] hover:bg-[var(--border-subtle)]"
                    aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div id={confirmPasswordErrorId} className="mt-2">
                    <ErrorMessage message={errors.confirmPassword} />
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="accept-terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="peer w-[18px] h-[18px] rounded-[4px] border-2 border-custom bg-tertiary appearance-none cursor-pointer transition-all checked:bg-accent-blue checked:border-accent-blue focus-visible:ring-[3px] focus-visible:ring-[var(--accent-blue)]/20"
                    disabled={isLoading}
                  />
                  <CheckCircle2
                    size={18}
                    className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-[var(--text-inverse)] transition-opacity"
                  />
                </div>
                <span className="text-sm text-muted leading-relaxed select-none">
                  {t('auth.acceptTerms')}{' '}
                  <Link href="/legal/terms" className="text-accent-blue font-medium hover:underline">{t('footer.terms')}</Link>
                  {' '}{t('common.and')}{' '}
                  <Link href="/legal/privacy" className="text-accent-blue font-medium hover:underline">{t('footer.privacy')}</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading || !acceptedTerms}
                className="w-full bg-accent-blue hover:bg-accent-blue-hover active:scale-[0.98] text-[var(--text-inverse)] font-semibold py-[14px] rounded-[9999px] transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    {t('auth.registerTitle')}
                  </>
                )}
              </button>
      </form>

      {oauthProviders.length > 0 && (
      <>
      <div className="mt-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-custom after:h-px after:flex-1 after:bg-custom text-xs text-muted font-medium">
        {t('auth.orRegisterWith')}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {oauthProviders.includes('google') && (
        <button
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading}
          type="button"
          className="flex items-center justify-center gap-2 bg-tertiary hover:bg-[var(--border-subtle)] active:scale-[0.98] border border-custom py-[10px] rounded-[9999px] text-sm font-semibold transition-all disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        )}
        {oauthProviders.includes('github') && (
        <button
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading}
          type="button"
          className="flex items-center justify-center gap-2 bg-tertiary hover:bg-[var(--border-subtle)] active:scale-[0.98] border border-custom py-[10px] rounded-[9999px] text-sm font-semibold transition-all disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </button>
        )}
      </div>
      </>
      )}

      <p className="text-center text-sm text-muted mt-6">
              {t('auth.hasAccount')}{' '}
              <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>

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

export default function RegisterPage() {
  const t = useT();
  return (
    <Suspense fallback={<LoadingSpinner t={t} />}>
      <Content />
    </Suspense>
  );
}
