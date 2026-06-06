'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { useT } from '@/i18n';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <ErrorFallback error={error} reset={reset} title={t('admin.errorPages.adminPanel.title')} message={t('admin.errorPages.adminPanel.message')} />
    </div>
  );
}
