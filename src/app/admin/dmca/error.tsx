'use client';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('admin.failedToLoad')}</h2>
      <p className="text-[var(--text-tertiary)] mt-2 mb-4">{t('common.retry')}</p>
      <Button onClick={reset}>{t('admin.retry')}</Button>
    </div>
  );
}
