'use client';

import { useT } from '@/i18n';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<string, { icon: typeof Clock; color: string; labelKey: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-400', labelKey: 'corrections.pending' },
  APPROVED: { icon: CheckCircle, color: 'text-green-400', labelKey: 'corrections.approved' },
  REJECTED: { icon: XCircle, color: 'text-red-400', labelKey: 'corrections.rejected' },
};

export function CorrectionsClient({ corrections }: { corrections: any[] }) {
  const t = useT();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('corrections.title')}</h1>

      {corrections.length === 0 && (
        <p className="text-center text-[var(--text-muted)] py-12">{t('corrections.empty')}</p>
      )}

      <div className="space-y-3">
        {corrections.map((corr: any) => {
          const config = statusConfig[corr.status] || { icon: Clock, color: 'text-gray-400', label: corr.status };
          const Icon = config.icon;
          return (
            <div key={corr.id} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className={`p-2 rounded-lg ${config.color} bg-[var(--surface-elevated)]`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/manga/${corr.chapter.manga.slug}`} className="font-medium text-sm hover:text-[var(--primary)]">
                  {corr.chapter.manga.title} — Cap. {corr.chapter.chapterNumber}
                </Link>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{corr.correctionText}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(corr.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.color.replace('text', 'bg')}/20`}>
                {t(config.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
