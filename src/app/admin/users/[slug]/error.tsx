'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { useT } from '@/i18n';

export default function AdminUserDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return <ErrorFallback error={error} reset={reset} title={t('admin.errorPages.userDetail.title')} message={t('admin.errorPages.userDetail.message')} />;
}
