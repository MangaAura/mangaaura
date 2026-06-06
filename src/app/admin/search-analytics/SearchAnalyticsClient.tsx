'use client';

import {
  Search,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Clock,
  Loader2,
  Hash,
  XCircle,
  Download,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  todaySearches: number;
  topQueries: { query: string; count: number }[];
  recentSearches: {
    id: string; query: string; createdAt: string;
    user: { id: string; username: string };
  }[];
  searchesLast30Days: { date: string; count: number }[];
  failedSearches?: { id: string; query: string; error: string; createdAt: string; user: { username: string } }[];
}

export default function SearchAnalyticsClient() {
  const t = useT();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const { data, error, isLoading } = useSWR<SearchAnalytics>(
    `/api/admin/search-analytics?${params}`, fetcher
  );

  const exportCSV = () => {
    if (!data?.topQueries.length && !data?.recentSearches.length) return;
    try {
      const rows: string[][] = [];
      rows.push([t('common.type'), t('common.queryUser'), t('common.countDate'), t('common.error')]);
      data.topQueries.forEach(q => rows.push(['Top Query', q.query, String(q.count), '']));
      data.recentSearches.forEach(s => rows.push(['Recent', `${s.user.username}: ${s.query}`, new Date(s.createdAt).toISOString(), '']));
      (data.failedSearches || []).forEach(f => rows.push(['Failed', f.query, new Date(f.createdAt).toISOString(), f.error]));
      const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('adminToasts.csvExported', { count: rows.length - 1 }), variant: 'success' });
    } catch {
      toast({ title: 'Error', description: t('adminToasts.csvExportError'), variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-[var(--error)]">
        {t('admin.errors.loadError')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.searchAnalytics.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.searchAnalytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 text-xs"
              placeholder={t('common.from')}
            />
            <span className="text-xs text-[var(--text-tertiary)]">→</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 text-xs"
              placeholder={t('common.to')}
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.searchAnalytics.totalSearches')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {data?.totalSearches.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <Search className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.searchAnalytics.uniqueUsers')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {data?.uniqueUsers || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--info)]/10 rounded-lg">
                <Users className="w-6 h-6 text-[var(--info)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('common.today')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {data?.todaySearches || 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--success)]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[var(--success)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              {t('admin.searchAnalytics.popularSearches')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topQueries && data.topQueries.length > 0 ? (
              <div className="space-y-2">
                {data.topQueries.map((q, i) => (
                  <div key={q.query} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--text-tertiary)] w-6">#{i + 1}</span>
                      <span className="text-sm text-[var(--text-primary)]">{q.query}</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{q.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-[var(--text-tertiary)]">{t('admin.common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('admin.searchAnalytics.last30Days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.searchesLast30Days ? (
              <div className="space-y-1">
                {data.searchesLast30Days.map((day) => {
                  const maxCount = Math.max(...data.searchesLast30Days.map((d) => d.count), 1);
                  const pct = (day.count / maxCount) * 100;
                  return (
                    <div key={day.date} className="flex items-center gap-3 text-xs">
                      <span className="w-24 text-[var(--text-tertiary)] shrink-0">
                        {new Date(day.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex-1 h-4 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[var(--text-tertiary)]">{day.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-[var(--text-tertiary)]">{t('admin.common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('admin.searchAnalytics.recentSearches')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentSearches && data.recentSearches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('common.user')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('admin.searchAnalytics.searchColumn')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-tertiary)]">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSearches.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-[var(--surface)]">
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{s.user.username}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{s.query}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-tertiary)] text-right">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-[var(--text-tertiary)]">{t('admin.searchAnalytics.emptyRecent')}</p>
          )}
        </CardContent>
      </Card>

      {/* Failed Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--warning)]">
            <XCircle className="w-5 h-5" />
            {t('admin.searchAnalytics.failedSearches')}
            <Badge variant="destructive" className="text-xs">
              {(data?.failedSearches || []).length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.failedSearches && data.failedSearches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('common.user')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('common.query')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">{t('common.error')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-tertiary)]">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.failedSearches.map((f) => (
                    <tr key={f.id} className="border-b hover:bg-[var(--surface)]">
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{f.user?.username || '—'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[var(--text-muted)]">{f.query}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive" className="text-[10px]">{f.error}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-tertiary)] text-right">
                        {new Date(f.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-[var(--text-tertiary)]">{t('admin.searchAnalytics.emptyFailed')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
