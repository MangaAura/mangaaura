import { Shield } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AIModerationQueue } from '@/components/Admin/AIModerationQueue';
import { ReportList } from '@/components/Admin/ReportList';
import { ReportStats } from '@/components/Admin/ReportStats';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Moderación | Admin',
  description: 'Panel de moderación y reportes',
};

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; tab?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/admin/moderation');
  }

  if (!['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
    redirect('/');
  }

  const { status, priority, tab } = await searchParams;

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const [
    totalPending,
    totalUnderReview,
    totalHighPriority,
    totalToday,
  ] = await Promise.all([
    prisma.userReport.count({ where: { status: 'PENDING' } }),
    prisma.userReport.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.userReport.count({
      where: {
        priority: { in: ['HIGH', 'CRITICAL'] },
        status: { not: 'RESOLVED' },
      },
    }),
    prisma.userReport.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    }),
  ]);

  const locale = await detectLocale();
  const t = getT(locale);
  const activeTab = tab || 'reports';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-[var(--primary)]" />
          {t('admin.moderation')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('admin.moderationDesc')}
        </p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-[var(--border)]">
        <Link
          href="/admin/moderation?tab=reports"
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {t('admin.moderationReports')}
        </Link>
        <Link
          href="/admin/moderation?tab=ai"
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ai'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {t('admin.moderationAI')}
        </Link>
      </div>

      {activeTab === 'reports' ? (
        <>
          <ReportStats
            stats={{
              pending: totalPending,
              underReview: totalUnderReview,
              highPriority: totalHighPriority,
              today: totalToday,
            }}
          />

          <div className="mt-8">
            <ReportList
              initialStatus={status}
              initialPriority={priority}
            />
          </div>
        </>
      ) : (
        <AIModerationQueue />
      )}
    </div>
  );
}
