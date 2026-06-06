'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { useT } from '@/i18n';

export default function AdminModerationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return <ErrorFallback error={error} reset={reset} title={t('admin.errorPages.moderation.title')} message={t('admin.errorPages.moderation.message')} />;
}
