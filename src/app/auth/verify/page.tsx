'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Mail, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useT } from '@/i18n';

type VerifyStatus = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const verifyToken = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage(t('auth.verify.missingToken'));
      return;
    }

    try {
      const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });

      if (res.ok) {
        setStatus('success');
        // Auto-redirect after 3 seconds
        setTimeout(() => router.push('/?verified=true'), 3000);
      } else if (res.status === 410) {
        setStatus('expired');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.error || t('auth.verify.genericError'));
      }
    } catch {
      setStatus('error');
      setErrorMessage(t('auth.verify.networkError'));
    }
  }, [token, router, t]);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      verifyToken();
    } else {
      setStatus('error');
      setErrorMessage(t('auth.verify.missingToken'));
    }
  }, [token, verifyToken, t]);

  const handleResend = async () => {
    setResending(true);
    setResendSent(false);
    try {
      // The resend endpoint uses the session to identify the user
      const res = await fetch('/api/auth/verify/resend', { method: 'POST' });
      if (res.ok) {
        setResendSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || t('auth.verify.resendError'));
      }
    } catch {
      setErrorMessage(t('auth.verify.networkError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h1 className="text-xl font-semibold">{t('auth.verify.verifying')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.verify.pleaseWait')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </motion.div>
              <h1 className="text-xl font-semibold">{t('auth.verify.successTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.verify.successMessage')}</p>
              <Button asChild className="mt-4">
                <Link href="/">{t('auth.verify.goHome')}</Link>
              </Button>
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center gap-4">
              <Clock className="h-16 w-16 text-amber-500" />
              <h1 className="text-xl font-semibold">{t('auth.verify.expiredTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.verify.expiredMessage')}</p>
              {resendSent ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-600 dark:text-green-400">
                  <Mail className="h-4 w-4" />
                  {t('auth.verify.resendSent')}
                </div>
              ) : (
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  variant="outline"
                  className="mt-4"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.verify.resending')}
                    </>
                  ) : (
                    t('auth.verify.resendButton')
                  )}
                </Button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              {token ? (
                <XCircle className="h-16 w-16 text-red-500" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              )}
              <h1 className="text-xl font-semibold">{t('auth.verify.errorTitle')}</h1>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/auth/login">{t('auth.verify.goToLogin')}</Link>
                </Button>
                {token && (
                  <Button onClick={handleResend} disabled={resending} variant="default">
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.verify.resending')}
                      </>
                    ) : (
                      t('auth.verify.resendButton')
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
