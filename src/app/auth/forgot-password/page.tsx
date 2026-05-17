'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/ui/Toast';
import { useAuthError } from '@/hooks/useAuthError';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const { toast } = useToast();
  const { error, clearError, handleNetworkError, handleValidationError } = useAuthError();

  const forgotPasswordSchema = z.object({
    email: z
      .string()
      .min(1, t('auth.validation.emailRequired'))
      .email(t('auth.validation.emailInvalid')),
  });
  
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (value: string): boolean => {
    try {
      forgotPasswordSchema.parse({ email: value });
      setValidationError('');
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = (err as any).issues?.[0]?.message || (err as any).errors?.[0]?.message || t('auth.validation.emailInvalid');
        setValidationError(message);
        return false;
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    clearError();
    
    if (touched) {
      validateEmail(value);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    clearError();

    if (!validateEmail(email)) {
      handleValidationError('email', validationError);
      setFormState('error');
      return;
    }

    setFormState('loading');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('not found') || data.error?.includes('no existe')) {
          setFormState('success');
          toast({
            title: t('auth.forgotPassword.toastTitle'),
            description: t('auth.forgotPassword.toastDesc'),
            variant: 'default',
          });
          return;
        }
        throw new Error(data.error || t('auth.forgotPassword.submitError'));
      }

      setFormState('success');
      toast({
        title: t('auth.forgotPassword.toastSuccessTitle'),
        description: t('auth.forgotPassword.toastSuccessDesc'),
        variant: 'default',
      });
    } catch (err) {
      handleNetworkError(() => handleSubmit(e));
      setFormState('error');
      
      setTimeout(() => {
        setFormState('success');
        toast({
          title: t('auth.forgotPassword.toastTitle'),
          description: t('auth.forgotPassword.toastDesc'),
          variant: 'default',
        });
      }, 100);
    }
  };

  const isValidEmail = touched && !validationError && email.length > 0;
  const hasError = (touched && validationError) || (formState === 'error' && error);

  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> {t('auth.resetPassword.backToHome')}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {formState === 'success' ? t('auth.forgotPassword.successTitle') : t('auth.forgotPassword.title')}
            </h1>
            <p className="text-muted">
              {formState === 'success'
                ? t('auth.forgotPassword.successSubtitle')
                : t('auth.forgotPassword.subtitle')}
            </p>
          </div>

          <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-xl">
            {formState === 'success' ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">{t('auth.forgotPassword.emailSent')}</h3>
                <p className="text-muted mb-6">
                  {t('auth.forgotPassword.emailSentDesc', { email })}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-semibold rounded-xl transition-colors"
                  >
                    <ArrowLeft size={18} />
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                  <button
                    onClick={() => {
                      setFormState('initial');
                      setEmail('');
                      setTouched(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 text-accent-blue hover:text-accent-blue-hover font-semibold transition-colors"
                  >
                    {t('auth.forgotPassword.sendAgain')}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6">
                    <ErrorMessage
                      title={error.title}
                      message={error.message}
                      severity={error.severity}
                      onDismiss={clearError}
                      action={error.action}
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-semibold mb-2">{t('auth.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={formState === 'loading'}
                        className={cn(
                          'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                          hasError
                            ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-1 focus:ring-[var(--error)]'
                            : isValidEmail
                              ? 'border-[var(--success)] focus:border-[var(--success)] focus:ring-1 focus:ring-[var(--success)]'
                              : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                        )}
                        placeholder={t('auth.forgotPassword.emailPlaceholder')}
                      />
                      {isValidEmail && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]" size={18} />
                      )}
                    </div>
                    {touched && validationError && (
                      <div className="mt-2">
                        <ErrorMessage
                          message={validationError}
                          severity="warning"
                          icon={<Mail className="w-4 h-4" />}
                        />
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      {t('auth.forgotPassword.emailHelp')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'loading' || !!validationError}
                    className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formState === 'loading' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {t('auth.forgotPassword.sending')}
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        {t('auth.forgotPassword.submit')}
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-custom">
                  <p className="text-sm text-muted">
                    <strong className="text-[var(--text-primary)]">{t('auth.forgotPassword.noEmail')}</strong>
                    <br />
                    {t('auth.forgotPassword.noEmailHint')}
                  </p>
                </div>
              </>
            )}
          </div>

          {formState !== 'success' && (
            <p className="text-center text-sm text-muted mt-8">
              {t('auth.forgotPassword.rememberedPassword')}{' '}
              <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                {t('auth.forgotPassword.loginHere')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
