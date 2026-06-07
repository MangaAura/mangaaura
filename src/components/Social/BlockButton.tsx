'use client';

import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';

import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface BlockButtonProps {
  targetUserId: string;
  className?: string;
}

export function BlockButton({ targetUserId, className }: BlockButtonProps) {
  const t = useT();
  const { data: session } = useSession();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingUnblock, setConfirmingUnblock] = useState(false);

  // Fetch initial block status
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    fetch(`/api/users/${targetUserId}/block`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.blocked) setIsBlocked(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.user?.id, targetUserId]);

  if (!session?.user?.id || targetUserId === session.user.id) return null;

  const handleBlock = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setIsBlocked(true);
        setConfirmingUnblock(false);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  const handleUnblock = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/block`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsBlocked(false);
        setConfirmingUnblock(false);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  if (isLoading) {
    return (
      <button
        disabled
        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] text-[var(--text-tertiary)] cursor-not-allowed', className)}
        aria-label={t('block.loading')}
      >
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t('block.loading')}
      </button>
    );
  }

  if (isBlocked) {
    if (confirmingUnblock) {
      return (
        <div className={cn('flex items-center gap-1.5', className)}>
          <button
            onClick={handleUnblock}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)]/30 transition-colors"
          >
            {t('block.confirmUnblock')}
          </button>
          <button
            onClick={() => setConfirmingUnblock(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setConfirmingUnblock(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]',
          className,
        )}
        title={t('block.blocked')}
        aria-label={t('block.blocked')}
      >
        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        {t('block.blocked')}
      </button>
    );
  }

  return (
    <button
      onClick={handleBlock}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        'text-[var(--error)] hover:bg-[var(--error)]/10 border border-transparent hover:border-[var(--error)]/20',
        className,
      )}
      title={t('block.blockUser')}
      aria-label={t('block.blockUser')}
    >
      <ShieldAlert className="w-4 h-4" aria-hidden="true" />
      {t('block.blockUser')}
    </button>
  );
}

export default BlockButton;
