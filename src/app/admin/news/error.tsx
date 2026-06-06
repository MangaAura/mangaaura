'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { useT } from '@/i18n';

export default function AdminNewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return (
    <ErrorFallback error={error} reset={reset} title={t('admin.errorPages.news.title')} message={t('admin.errorPages.news.message')} />
  );
}
