'use client';

import { motion } from 'framer-motion';
import { X, Send, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useT } from '@/i18n';

interface VerificationBannerProps {
  email: string;
}

export function VerificationBanner({ email }: VerificationBannerProps) {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  if (dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    setResendSent(false);
    try {
      const res = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendSent(true);
      }
    } catch {
      // Silently fail
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="relative bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-5 w-5 shrink-0 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-300">
              {t('auth.verify.bannerMessage')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {resendSent ? (
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('auth.verify.resendSent')}
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                type="button"
                className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {t('auth.verify.resendButton')}
              </button>
            )}
            <Link
              href="/auth/verify?resend=true"
              className="text-xs font-medium text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 whitespace-nowrap"
            >
              {t('auth.verify.openPage')}
            </Link>
            <button
              onClick={() => setDismissed(true)}
              type="button"
              className="ml-1 rounded-full p-1 text-amber-500/60 transition-colors hover:bg-amber-500/10 hover:text-amber-600"
              aria-label={t('common.dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
