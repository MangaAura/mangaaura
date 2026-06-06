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
  Clock,
  Eye,
  Star,
  UserPlus,
  RefreshCw,
  ExternalLink,
  Settings,
  Activity,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import useSWR from 'swr';

import { ChartsSection } from '@/components/Admin/ChartsSection';
import { StatCard } from '@/components/Admin/StatCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
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
  moderation: {
    pendingCorrections: number;
    flaggedComments: number;
    reportedContent: number;
  };
  changes?: {
    users?: number;
    mangas?: number;
  };
  popularMangas: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorName: string;
    totalViews: number;
    rating: number | null;
    chapterCount: number;
  }>;
  activityData: { date: string; users: number; views: number }[];
  recentUsers: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
  }>;
  recentMangas: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorName: string;
    createdAt: string;
  }>;
}

// Flat shape the template consumes
interface DashboardStats {
  totalUsers: number;
  totalMangas: number;
  totalChapters: number;
  totalComments: number;
  changes?: {
    users?: number;
    mangas?: number;
    chapters?: number;
    comments?: number;
  };
  newUsersToday: number;
  newMangasToday: number;
  newChaptersToday: number;
  newCommentsToday: number;
  activityData: { date: string; users: number; views: number }[];
  moderation: {
    pendingCorrections: number;
    flaggedComments: number;
    reportedContent: number;
  };
}

interface ModerationAlert {
  id: string;
  type: string;
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-[var(--surface-sunken)] rounded-xl h-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--surface)]/20 to-transparent shimmer" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse bg-[var(--surface-sunken)] rounded-lg h-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--surface)]/20 to-transparent shimmer" />
    </div>
  );
}

const quickActions = [
  { href: '/admin/users', label: 'admin.manageUsers', desc: 'admin.manageUsersDesc', icon: Users, color: 'var(--primary)' },
  { href: '/admin/comments', label: 'admin.moderation', desc: 'admin.moderationDesc', icon: Shield, color: 'var(--warning)' },
  { href: '/admin/settings', label: 'admin.configuracion', desc: 'admin.ajustesSitio', icon: Settings, color: 'var(--accent-purple)' },
  { href: '/admin/manga', label: 'admin.manageManga', desc: 'admin.manageMangaDesc', icon: BookOpen, color: 'var(--success)' },
  { href: '/admin/users', label: 'admin.roles', desc: 'admin.rolesDesc', icon: Shield, color: 'var(--primary)' },
  { href: '/admin/export', label: 'admin.export', desc: 'admin.exportDesc', icon: FileText, color: 'var(--accent-purple)' },
  { href: '/admin/announcements', label: 'admin.announcements', desc: 'admin.announcementsDesc', icon: MessageSquare, color: 'var(--warning)' },
  { href: '/admin/settings', label: 'admin.cache', desc: 'admin.cacheDesc', icon: RefreshCw, color: 'var(--success)' },
];

export default function AdminDashboardClient() {
  const t = useT();
  const { data: rawStats, error: statsError, isLoading: statsLoading } = useSWR<ApiDashboardStats>(
    '/api/admin/stats',
    fetcher,
    { refreshInterval: 60000 }
  );

  // Flatten the nested API response
  const stats = useMemo((): DashboardStats | undefined => {
    if (!rawStats) return undefined;
    return {
      totalUsers: rawStats.counts.totalUsers,
      totalMangas: rawStats.counts.totalMangas,
      totalChapters: rawStats.counts.totalChapters,
      totalComments: rawStats.counts.totalComments,
      newUsersToday: rawStats.today.newUsers,
      newMangasToday: rawStats.today.newMangas,
      newChaptersToday: rawStats.today.newChapters,
      newCommentsToday: rawStats.today.newComments,
      changes: rawStats.changes,
      activityData: rawStats.activityData,
      moderation: rawStats.moderation,
    };
  }, [rawStats]);

  const popularMangas = rawStats?.popularMangas || [];
  const recentUsers = rawStats?.recentUsers || [];
  const recentMangas = rawStats?.recentMangas || [];
  const moderationStats = rawStats?.moderation;

  const { data: alertsData, isLoading: alertsLoading } = useSWR<{ alerts: ModerationAlert[] }>(
    '/api/admin/moderation/alerts',
    fetcher,
    { refreshInterval: 30000 }
  );

  const alerts = alertsData?.alerts || [];
  const isLoading = statsLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6" role="status" aria-label={t('admin.common.loading')}>
        <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.dashboard')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.overview')}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {t('admin.autoRefresh')}
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {t('admin.lastUpdated')}: {new Date().toLocaleTimeString()}
          </span>
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
        <Link href="/admin/comments" className="block">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-5 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.newUsersToday')}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.newUsersToday || 0}</p>
              </div>
              <div className="p-2.5 bg-[var(--success)]/10 rounded-lg">
                <UserPlus className="w-5 h-5 text-[var(--success)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-5 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.nuevosMangas')}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.newMangasToday || 0}</p>
              </div>
              <div className="p-2.5 bg-[var(--primary)]/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-[var(--primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-5 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.nuevosCapitulos')}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.newChaptersToday || 0}</p>
              </div>
              <div className="p-2.5 bg-[var(--accent-purple)]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[var(--accent-purple)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-5 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.newCommentsToday')}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.newCommentsToday || 0}</p>
              </div>
              <div className="p-2.5 bg-[var(--warning)]/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-[var(--warning)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      {rawStats?.activity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              {t('admin.activitySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[var(--surface)] rounded-lg">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{rawStats.activity.last24h.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('admin.last24h')}</p>
              </div>
              <div className="text-center p-4 bg-[var(--surface)] rounded-lg">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{rawStats.activity.last7d.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('admin.last7d')}</p>
              </div>
              <div className="text-center p-4 bg-[var(--surface)] rounded-lg">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{rawStats.activity.last30d.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('admin.last30d')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Stats Summary */}
      {moderationStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-[var(--error)]/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.correccionesPendientes')}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{moderationStats.pendingCorrections}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-[var(--warning)]/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.comentariosReportados')}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{moderationStats.flaggedComments}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-[var(--accent-purple)]/10 rounded-lg">
                <Shield className="w-5 h-5 text-[var(--accent-purple)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('admin.contenidoReportado')}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{moderationStats.reportedContent}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Moderation Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" aria-hidden="true" />
              {t('admin.moderationAlerts')}
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
            <Link href="/admin/comments" aria-label="Ver todos los reportes de moderación">
              <Button variant="ghost" size="sm">
                {t('admin.viewAll')} <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
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
                    <Link href="/admin/comments">
                      <Button variant="outline" size="sm">
                        {t('admin.review')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Mangas */}
      {popularMangas.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-[var(--primary)]" />
                {t('admin.mangasMasPopulares')}
              </CardTitle>
              <Link href="/admin/manga">
                <Button variant="ghost" size="sm">
                  {t('admin.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularMangas.slice(0, 5).map((manga, i) => (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.slug}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 transition-colors group"
                >
                  <span className="w-6 text-center text-sm font-bold text-[var(--text-tertiary)]">#{i + 1}</span>
                  {manga.coverUrl ? (
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="w-10 h-14 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded bg-[var(--surface-sunken)] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[var(--text-tertiary)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">{manga.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{manga.authorName} · {manga.chapterCount} caps</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Eye className="w-3 h-3" />
                      {manga.totalViews.toLocaleString()}
                    </div>
                    {manga.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="w-3 h-3" />
                        {manga.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-[var(--primary)]" />
                {t('admin.ultimosUsuarios')}
              </CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  {t('admin.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">{t('admin.sinUsuariosRecientes')}</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                      ) : (
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.displayName || user.username}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">@{user.username}</p>
                    </div>
                    <time className="text-xs text-[var(--text-tertiary)]" dateTime={user.createdAt}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Mangas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                {t('admin.ultimosMangas')}
              </CardTitle>
              <Link href="/admin/manga">
                <Button variant="ghost" size="sm">
                  {t('admin.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentMangas.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">{t('admin.sinMangasRecientes')}</p>
            ) : (
              <div className="space-y-3">
                {recentMangas.map((manga) => (
                  <Link
                    key={manga.id}
                    href={`/admin/manga/${manga.slug}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 transition-colors group"
                  >
                    {manga.coverUrl ? (
                      <img src={manga.coverUrl} alt={manga.title} className="w-10 h-14 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded bg-[var(--surface-sunken)] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[var(--text-tertiary)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">{manga.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{manga.authorName}</p>
                    </div>
                    <time className="text-xs text-[var(--text-tertiary)]" dateTime={manga.createdAt}>
                      {new Date(manga.createdAt).toLocaleDateString()}
                    </time>
                    <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
              {t('admin.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href + action.label} href={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors group cursor-pointer">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${action.color}15` }}>
                      <action.icon className="w-4 h-4" style={{ color: action.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t(action.label)}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{t(action.desc)}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              {t('admin.quickStats')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">{t('admin.mangasMasPopulares')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{popularMangas.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">{t('admin.totalUsers')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{stats?.totalUsers.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">{t('admin.chapters')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{stats?.totalChapters.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">{t('admin.comments')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{stats?.totalComments.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">{t('admin.newUsersToday')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{stats?.newUsersToday || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
