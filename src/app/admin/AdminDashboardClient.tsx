'use client';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import useSWR from 'swr';

import { ChartsSection } from '@/components/Admin/ChartsSection';
import { StatCard } from '@/components/Admin/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

// Shape returned by the API
interface ApiDashboardStats {
  counts: {
    totalUsers: number;
    totalMangas: number;
    totalChapters: number;
    totalComments: number;
  };
  today: {
    newUsers: number;
    newMangas: number;
    newChapters: number;
    newComments: number;
  };
  activity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

// Flat shape the template consumes
interface DashboardStats {
  totalUsers: number;
  totalMangas: number;
  totalChapters: number;
  totalComments: number;
  changes?: {
    users: number;
    mangas: number;
    chapters: number;
    comments: number;
  };
  newUsersToday: number;
  newMangasToday: number;
  newCommentsToday: number;
  activityData?: { date: string; users: number; views: number }[];
}

interface ModerationAlert {
  id: string;
  type: string;
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

export default function AdminDashboardClient() {
  const t = useT();
  const { data: rawStats, error: statsError, isLoading: statsLoading } = useSWR<ApiDashboardStats>(
    '/api/admin/stats',
    fetcher,
    { refreshInterval: 60000 }
  );

  // Flatten the nested API response to match the template expectations
  const stats = useMemo((): DashboardStats | undefined => {
    if (!rawStats) return undefined;
    return {
      totalUsers: rawStats.counts.totalUsers,
      totalMangas: rawStats.counts.totalMangas,
      totalChapters: rawStats.counts.totalChapters,
      totalComments: rawStats.counts.totalComments,
      newUsersToday: rawStats.today.newUsers,
      newMangasToday: rawStats.today.newMangas,
      newCommentsToday: rawStats.today.newComments,
    };
  }, [rawStats]);

  const { data: alertsData, error: _alertsError, isLoading: alertsLoading } = useSWR<{ alerts: ModerationAlert[] }>(
    '/api/admin/moderation/alerts',
    fetcher,
    { refreshInterval: 30000 }
  );

  const alerts = alertsData?.alerts || [];
  const isLoading = statsLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6" role="status" aria-label="Cargando panel de administración">
        <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--surface-sunken)] rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-[var(--surface-sunken)] rounded"></div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="text-center py-12" role="alert">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('admin.failedToLoad')}</h2>
        <p className="text-[var(--text-tertiary)] mt-2">{t('common.retry')}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          {t('admin.refresh')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.dashboard')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.overview')}</p>
        </div>
        <div className="text-sm text-[var(--text-tertiary)]">
          {t('admin.lastUpdated')}: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users" className="block">
          <StatCard
            title={t('admin.totalUsers')}
            value={stats?.totalUsers.toLocaleString() || '0'}
            description={t('admin.activeAccounts')}
            change={stats?.changes?.users}
            changeLabel={t('admin.fromLastMonth')}
            icon={Users}
            trend={stats?.changes?.users && stats.changes.users > 0 ? 'up' : stats?.changes?.users && stats.changes.users < 0 ? 'down' : 'neutral'}
          />
        </Link>
        <Link href="/admin/manga" className="block">
          <StatCard
            title={t('admin.totalMangas')}
            value={stats?.totalMangas.toLocaleString() || '0'}
            description={t('admin.publishedSeries')}
            change={stats?.changes?.mangas}
            changeLabel={t('admin.fromLastMonth')}
            icon={BookOpen}
            trend={stats?.changes?.mangas && stats.changes.mangas > 0 ? 'up' : stats?.changes?.mangas && stats.changes.mangas < 0 ? 'down' : 'neutral'}
          />
        </Link>
        <Link href="/admin/manga" className="block">
          <StatCard
            title={t('admin.chapters')}
            value={stats?.totalChapters.toLocaleString() || '0'}
            description={t('admin.publishedChapters')}
            change={stats?.changes?.chapters}
            changeLabel={t('admin.fromLastMonth')}
            icon={FileText}
            trend={stats?.changes?.chapters && stats.changes.chapters > 0 ? 'up' : stats?.changes?.chapters && stats.changes.chapters < 0 ? 'down' : 'neutral'}
          />
        </Link>
        <Link href="/admin/moderation" className="block">
          <StatCard
            title={t('admin.comments')}
            value={stats?.totalComments.toLocaleString() || '0'}
            description={t('admin.totalComments')}
            change={stats?.changes?.comments}
            changeLabel={t('admin.fromLastMonth')}
            icon={MessageSquare}
            trend={stats?.changes?.comments && stats.changes.comments > 0 ? 'up' : stats?.changes?.comments && stats.changes.comments < 0 ? 'down' : 'neutral'}
          />
        </Link>
      </div>

      <ChartsSection
        activityData={stats?.activityData}
        totalMangas={stats?.totalMangas}
        totalChapters={stats?.totalChapters}
        totalComments={stats?.totalComments}
      />

      {/* Today's Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.newUsersToday')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {stats?.newUsersToday || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--success)]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[var(--success)]" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.newMangasToday')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {stats?.newMangasToday || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.newCommentsToday')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {stats?.newCommentsToday || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--warning)]/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-[var(--warning)]" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">              <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" aria-hidden="true" />
              {t('admin.moderationAlerts')}
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
            <Link href="/admin/moderation" aria-label="Ver todos los reportes de moderación">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded"></div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[var(--success)]" aria-hidden="true" />
              <p>{t('admin.noPendingAlerts')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 rounded-lg border
                  ${alert.severity === 'high'
                      ? 'bg-[var(--error)]/5 border-[var(--error)]/20'
                      : alert.severity === 'medium'
                        ? 'bg-[var(--warning)]/5 border-[var(--warning)]/20'
                        : 'bg-[var(--surface)] border-[var(--border)]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.severity === 'high' ? (
                      <XCircle className="w-5 h-5 text-[var(--error)]" aria-hidden="true" />
                    ) : alert.severity === 'medium' ? (
                      <AlertTriangle className="w-5 h-5 text-[var(--warning)]" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
                    )}
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{alert.message}</p>
                      <p className="text-sm text-[var(--text-tertiary)] capitalize">{alert.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                      {alert.count} items
                    </span>
                    <Link href="/admin/moderation">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/users" aria-label="Gestionar usuarios">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <Users className="w-6 h-6 text-[var(--primary)]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{t('admin.manageUsers')}</h3>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.manageUsersDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/moderation" aria-label="Panel de moderación">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[var(--warning)]/10 rounded-lg">
                <Shield className="w-6 h-6 text-[var(--warning)]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{t('admin.moderation')}</h3>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.moderationDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/manga" aria-label="Gestionar mangas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[var(--success)]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[var(--success)]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{t('admin.manageManga')}</h3>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.manageMangaDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
