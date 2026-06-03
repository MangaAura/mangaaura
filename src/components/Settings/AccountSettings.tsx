'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTour } from '@/components/OnboardingTour/TourContext';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface AccountSettingsProps {
  userId: string;
}

export function AccountSettings(_props: AccountSettingsProps) {
  const t = useT();
  const { restartTour } = useTour();
  const [markedForDeletionAt, setMarkedForDeletionAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/delete-request');
      if (res.ok) {
        const data = await res.json();
        setMarkedForDeletionAt(data.markedForDeletionAt);
      }
    } catch {}
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void checkStatus(); });
  }, [checkStatus]);

  const handleDeleteRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('settings.errorRequestingDeletion'));
      }
      const data = await res.json();
      setMarkedForDeletionAt(data.deletionDate);
      setShowConfirm(false);
      toast({
        title: t('settings.deletionRequestSent'),
        description: t('settings.deletionRequestSentDesc'),
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: t('settings.errorSaving'),
        description: error instanceof Error ? error.message : t('settings.errorRequestingDeletion'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('settings.errorCancellingDeletion'));
      }
      setMarkedForDeletionAt(null);
      toast({
        title: t('settings.deletionCancelled'),
        description: t('settings.deletionCancelledDesc'),
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: t('settings.errorSaving'),
        description: error instanceof Error ? error.message : t('settings.errorCancellingDeletion'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletionDate = markedForDeletionAt
    ? new Date(markedForDeletionAt).toLocaleDateString()
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {t('settings.account')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {t('settings.accountDesc')}
        </p>
      </div>

      {/* ── Tour interactivo ── */}
      <Card className="p-6 border border-[var(--border)]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex-shrink-0">
            <img
              src="/MangaAura_logo_circular.svg"
              alt="MangaAura"
              className="w-full h-full"
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--text-primary)] mb-1">
              {t('onboarding.restartTour')}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              {t('onboarding.restartTourDesc')}
            </p>

            <Button
              variant="outline"
              onClick={() => restartTour()}
              className="border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('onboarding.restartTour')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className={cn('p-6 border', markedForDeletionAt ? 'border-[var(--error)]/30' : 'border-[var(--border)]')}>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            markedForDeletionAt ? 'bg-[var(--error)]/20' : 'bg-[var(--surface-sunken)]'
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5',
              markedForDeletionAt ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--text-primary)] mb-1">
              {t('settings.deleteAccount')}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              {markedForDeletionAt
                ? t('settings.deletionRequested', { date: deletionDate ?? '' })
                : t('settings.requestDeletionDesc')}
            </p>

            {markedForDeletionAt ? (
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                isLoading={isLoading}
              >
                {t('settings.cancelDeletion')}
              </Button>
            ) : showConfirm ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteRequest}
                  isLoading={isLoading}
                >
                  {t('settings.confirmDelete')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                >
                  {t('settings.cancel')}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowConfirm(true)}
                className="text-[var(--error)] border-[var(--error)]/30 hover:bg-[var(--error)]/10"
              >
                {t('settings.requestDeletion')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
