'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { useT } from '@/i18n';

export default function AdminMangaDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return <ErrorFallback error={error} reset={reset} title={t('admin.errorPages.mangaDetail.title')} message={t('admin.errorPages.mangaDetail.message')} />;
}
