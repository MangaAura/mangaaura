'use client';

import {
  ArrowLeft,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Camera,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { z } from 'zod';

import { ImageCropperUploader, type ImageCropperUploaderHandle } from '@/components/ui/ImageCropperUploader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export default function CompleteRegistrationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useT();

  const token = searchParams?.get('token') || '';

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');

  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({});
  const [isLoading, setIsLoading] = useState(true); // starts true while verifying token
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<{ title: string; message: string; severity: 'error' | 'warning' } | null>(null);

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const cropperRef = useRef<ImageCropperUploaderHandle>(null);
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const schema = useMemo(() => z.object({
    displayName: z
      .string()
      .min(1, t('auth.validation.displayNameRequired'))
      .max(50, t('auth.validation.displayNameMax')),
    username: z
      .string()
      .min(3, t('auth.validation.usernameMin'))
      .max(30, t('auth.validation.usernameMax'))
      .regex(/^[a-zA-Z0-9_]+$/, t('auth.validation.usernamePattern')),
  }), [t]);

  // On mount: decode the token to pre-fill email
  useEffect(() => {
    if (!token) {
      setAuthError({
        title: t('auth.completeRegistration.invalidToken'),
        message: t('auth.completeRegistration.invalidTokenDesc'),
        severity: 'error',
      });
      setIsLoading(false);
      return;
    }

    // Decode the token (payload is not encrypted, just signed)
    // We only extract the email from the token; the server will verify it
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      if (payload.email) {
        setEmail(payload.email);
      }
    } catch {
      // Ignore decode errors; server will validate
    }

    setIsLoading(false);
  }, [token, t]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Username availability check (same pattern as RegisterClient)
  const checkUsername = (value: string) => {
    if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

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
          if (!controller.signal.aborted) {
            setUsernameAvailable(data.available);
            if (!data.available) {
              setErrors((prev) => ({ ...prev, username: t('auth.validation.usernameTaken') }));
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setUsernameAvailable(null);
      } finally {
        if (!controller.signal.aborted) setUsernameChecking(false);
        if (abortControllerRef.current === controller) abortControllerRef.current = null;
      }
    }, 500);
  };

  const handleAvatarCropComplete = async (blob: Blob) => {
    // Convert blob to base64 data URL for sending in JSON
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarDataUrl(dataUrl);
      setAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(blob);
  };

  const handleRemoveAvatar = () => {
    setAvatarDataUrl(null);
    setAvatarPreview(null);
    setAvatarError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    // Validate
    const validated = schema.safeParse({ displayName, username });
    if (!validated.success) {
      const fieldErrors: typeof errors = {};
      validated.error.issues.forEach((issue) => {
        if (issue.path[0] === 'displayName' || issue.path[0] === 'username') {
          fieldErrors[issue.path[0]] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      const res = await fetch('/api/auth/complete-oauth-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          displayName: displayName.trim(),
          username: username.trim(),
          avatarDataUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError({
          title: t('common.error'),
          message: data.error || t('auth.completeRegistration.errorDefault'),
          severity: 'error',
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: t('auth.completeRegistration.success'),
        variant: 'default',
      });

      // Redirect to login page so the user can sign in with their new account
      router.push('/auth/login');
    } catch {
      setAuthError({
        title: t('errors.networkError'),
        message: t('errors.connectionFailed'),
        severity: 'error',
      });
      setIsSubmitting(false);
    }
  };

  const inputBase = 'w-full pl-10 pr-4 py-3 bg-tertiary border-2 rounded-[8px] outline-none transition-all text-sm';
  const inputBorderNormal = 'border-custom focus:border-accent-blue focus:ring-[3px] focus:ring-[var(--accent-blue)]/20';
  const inputBorderError = 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[3px] focus:ring-[var(--error)]/20';
  const inputBorderSuccess = 'border-[var(--success)] focus:border-[var(--success)] focus:ring-[3px] focus:ring-[var(--success)]/20';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="p-6">
        <Link href="/auth/register" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> {t('common.back')}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="text-center mb-8 [animation:fadeSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            <h1 className="text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02em] mb-2 text-[var(--text-primary)]">
              {t('auth.completeRegistration.title')}
            </h1>
            <p className="text-[var(--text-secondary)]">
              {t('auth.completeRegistration.subtitle')}
            </p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-fg-primary">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-tertiary border-2 rounded-[8px] outline-none text-sm opacity-60 cursor-not-allowed',
                      'border-custom'
                    )}
                    tabIndex={-1}
                    aria-label={t('auth.email')}
                  />
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]" size={18} />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="complete-display-name" className="block text-sm font-semibold mb-2 text-fg-primary">
                  {t('auth.displayName')} <span className="text-[var(--error)]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    id="complete-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (errors.displayName) {
                        const result = schema.shape.displayName.safeParse(e.target.value);
                        setErrors((prev) => ({ ...prev, displayName: result.success ? '' : result.error!.issues[0].message }));
                      }
                    }}
                    onBlur={() => {
                      const result = schema.shape.displayName.safeParse(displayName);
                      setErrors((prev) => ({ ...prev, displayName: result.success ? '' : result.error!.issues[0].message }));
                    }}
                    className={cn(
                      inputBase,
                      errors.displayName ? inputBorderError
                        : displayName && !errors.displayName ? inputBorderSuccess
                        : inputBorderNormal
                    )}
                    placeholder={t('auth.completeRegistration.displayNamePlaceholder')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.displayName}
                    aria-required="true"
                    autoComplete="name"
                  />
                  {displayName && !errors.displayName && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]" size={18} />
                  )}
                </div>
                {errors.displayName && (
                  <div className="mt-2">
                    <ErrorMessage message={errors.displayName} />
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="complete-username" className="block text-sm font-semibold mb-2 text-fg-primary">
                  {t('auth.username')} <span className="text-[var(--error)]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input
                    id="complete-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((prev) => ({ ...prev, username: '' }));
                      checkUsername(e.target.value);
                    }}
                    onBlur={() => {
                      if (!username) {
                        const result = schema.shape.username.safeParse(username);
                        setErrors((prev) => ({ ...prev, username: result.success ? '' : result.error!.issues[0].message }));
                      }
                    }}
                    className={cn(
                      inputBase,
                      'pr-10',
                      errors.username ? inputBorderError
                        : usernameAvailable === true && !errors.username ? inputBorderSuccess
                        : username && !errors.username ? inputBorderNormal
                        : inputBorderNormal
                    )}
                    placeholder="usuario123"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.username}
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
                {usernameAvailable === true && !errors.username && username.length >= 3 && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-[var(--success)]/10 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-[var(--success)]">{t('auth.validation.usernameAvailable')}</p>
                  </div>
                )}
                {errors.username && (
                  <div className="mt-2">
                    <ErrorMessage message={errors.username} />
                  </div>
                )}
              </div>

              {/* Avatar (optional) */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-fg-primary">
                  {t('auth.completeRegistration.avatar')} <span className="text-muted text-xs font-normal">({t('auth.completeRegistration.avatarOptional')})</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Avatar preview */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--surface-sunken)] border-2 border-[var(--border-subtle)]">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={t('auth.completeRegistration.avatarPreview')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Camera size={28} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => cropperRef.current?.open()}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium bg-accent-blue hover:bg-accent-blue-hover active:scale-[0.98] text-[var(--text-inverse)] rounded-[9999px] transition-all disabled:opacity-40"
                    >
                      {avatarPreview ? t('auth.completeRegistration.changePhoto') : t('auth.completeRegistration.addPhoto')}
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 text-xs font-medium text-muted hover:text-[var(--error)] transition-colors"
                      >
                        {t('auth.completeRegistration.removePhoto')}
                      </button>
                    )}
                  </div>
                </div>

                {avatarError && (
                  <div className="mt-2">
                    <ErrorMessage message={avatarError} />
                  </div>
                )}

                {/* Hidden cropper — opens on button click */}
                <ImageCropperUploader
                  ref={cropperRef}
                  aspect={1}
                  cropperTitle={t('auth.completeRegistration.cropperTitle')}
                  cropperSubtitle={t('auth.completeRegistration.cropperSubtitle')}
                  onCropComplete={handleAvatarCropComplete}
                  onError={(err) => setAvatarError(err)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !displayName.trim() || !username.trim() || !!errors.username || !!errors.displayName}
                className="w-full bg-accent-blue hover:bg-accent-blue-hover active:scale-[0.98] text-[var(--text-inverse)] font-semibold py-[14px] rounded-[9999px] transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('auth.completeRegistration.creating')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {t('auth.completeRegistration.submit')}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
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
