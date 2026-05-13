'use client';

import useSWR from 'swr';
import { StatCard } from '@/components/Admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalMangas: number;
  totalChapters: number;
  totalComments: number;
  pendingReports: number;
  newUsersToday: number;
  newMangasToday: number;
  newCommentsToday: number;
  activityData: { date: string; users: number; views: number }[];
  changes: {
    users: number;
    mangas: number;
    chapters: number;
    comments: number;
  };
}

interface ModerationAlert {
  id: string;
  type: 'report' | 'abuse' | 'spam';
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboardPage() {
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<DashboardStats>(
    '/api/admin/stats',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: alertsData, error: alertsError, isLoading: alertsLoading } = useSWR<{ alerts: ModerationAlert[] }>(
    '/api/admin/moderation/alerts',
    fetcher,
    { refreshInterval: 30000 }
  );

  const alerts = alertsData?.alerts || [];
  const isLoading = statsLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
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
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Failed to load dashboard</h2>
        <p className="text-[var(--text-tertiary)] mt-2">Please try refreshing the page</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-muted)]">Overview of your platform</p>
        </div>
        <div className="text-sm text-[var(--text-tertiary)]">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users" className="block">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers.toLocaleString() || '0'}
            description="Active accounts"
            change={stats?.changes?.users}
            changeLabel="from last month"
            icon={Users}
            trend={stats?.changes?.users && stats.changes.users > 0 ? 'up' : stats?.changes?.users && stats.changes.users < 0 ? 'down' : 'neutral'}
          />
        </Link>
        <Link href="/admin/manga" className="block">
          <StatCard
            title="Total Mangas"
            value={stats?.totalMangas.toLocaleString() || '0'}
            description="Published series"
            change={stats?.changes?.mangas}
            changeLabel="from last month"
            icon={BookOpen}
            trend={stats?.changes?.mangas && stats.changes.mangas > 0 ? 'up' : stats?.changes?.mangas && stats.changes.mangas < 0 ? 'down' : 'neutral'}
          />
        </Link>
        <Link href="/admin/manga" className="block">
          <StatCard
            title="Chapters"
            value={stats?.totalChapters.toLocaleString() || '0'}
            description="Published chapters"
            change={stats?.changes?.chapters}
            changeLabel="from last month"
            icon={FileText}
            trend={stats?.changes?.chapters && stats.changes.chapters > 0 ? 'up' : stats?.changes?.chapters && stats.changes.chapters < 0 ? 'down' : 'neutral'}
          />
        </Link>
        <Link href="/admin/moderation" className="block">
          <StatCard
            title="Comments"
            value={stats?.totalComments.toLocaleString() || '0'}
            description="Total comments"
            change={stats?.changes?.comments}
            changeLabel="from last month"
            icon={MessageSquare}
            trend={stats?.changes?.comments && stats.changes.comments > 0 ? 'up' : stats?.changes?.comments && stats.changes.comments < 0 ? 'down' : 'neutral'}
          />
        </Link>
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.activityData && stats.activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      name="New Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Page Views"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                  No activity data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Mangas', value: stats?.totalMangas || 0 },
                    { name: 'Chapters', value: stats?.totalChapters || 0 },
                    { name: 'Comments', value: stats?.totalComments || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">New Users Today</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {stats?.newUsersToday || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--success)]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[var(--success)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">New Mangas Today</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {stats?.newMangasToday || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">New Comments Today</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {stats?.newCommentsToday || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--warning)]/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-[var(--warning)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              Moderation Alerts
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
            <Link href="/admin/moderation">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
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
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[var(--success)]" />
              <p>No pending moderation alerts</p>
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
                      <XCircle className="w-5 h-5 text-[var(--error)]" />
                    ) : alert.severity === 'medium' ? (
                      <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
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
        <Link href="/admin/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <Users className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">Manage Users</h3>
                <p className="text-sm text-[var(--text-tertiary)]">View and edit user accounts</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/moderation">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[var(--warning)]/10 rounded-lg">
                <Shield className="w-6 h-6 text-[var(--warning)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">Moderation</h3>
                <p className="text-sm text-[var(--text-tertiary)]">Review reported content</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/manga">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[var(--success)]/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[var(--success)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">Manage Manga</h3>
                <p className="text-sm text-[var(--text-tertiary)]">Edit manga metadata</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}


