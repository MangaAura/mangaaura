'use client';

import {
  Shield,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Clock,
  FileWarning,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface CspReportEntry {
  id: string;
  blockedUri: string;
  violatedDirective: string;
  documentUri: string;
  sourceFile: string | null;
  lineNumber: number | null;
  disposition: string;
  createdAt: string;
  isNoise: boolean;
}

interface CspReportsResponse {
  reports: CspReportEntry[];
  total: number;
  page: number;
  totalPages: number;
  summary?: {
    totalReal: number;
    totalNoise: number;
    byDirective: Array<{ directive: string; count: number }>;
  };
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function CspReportsClient() {
  const t = useT();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [directive, setDirective] = useState('');
  const [includeNoise, setIncludeNoise] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (directive) params.set('directive', directive);
  if (includeNoise) params.set('includeNoise', 'true');

  const { data, error, isLoading, mutate } = useSWR<CspReportsResponse>(
    `/api/admin/csp-reports?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const handleDismissAll = async () => {
    try {
      const res = await fetch('/api/admin/csp-reports/dismiss', { method: 'POST' });
      if (res.ok) {
        await mutate();
        setShowClearDialog(false);
        toast({ title: t('admin.pages.cspReports.dismissed'), description: t('admin.pages.cspReports.dismissedAllDesc'), variant: 'success' });
      } else {
        toast({ title: t('common.error'), description: t('admin.pages.cspReports.failedDismissAll'), variant: 'error' });
      }
    } catch {
      toast({ title: t('common.error'), description: t('admin.pages.cspReports.unexpectedError'), variant: 'error' });
    }
  };

  const handleDismissOne = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/csp-reports/${reportId}/dismiss`, { method: 'POST' });
      if (res.ok) {
        await mutate();
        toast({ title: t('admin.pages.cspReports.dismissed'), description: t('admin.pages.cspReports.dismissedOneDesc'), variant: 'success' });
      } else {
        toast({ title: t('common.error'), description: t('admin.pages.cspReports.failedDismissOne'), variant: 'error' });
      }
    } catch {
      toast({ title: t('common.error'), description: t('admin.pages.cspReports.unexpectedError'), variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.cspReports.title')}
          </h1>
          <p className="text-[var(--text-muted)]">
            {t('admin.pages.cspReports.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && data.reports.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowClearDialog(true)}>
              <CheckCheck className="w-4 h-4 mr-1" />
              {t('admin.pages.cspReports.dismissAll')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('admin.pages.cspReports.refresh')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.pages.cspReports.realViolations')}</p>
                <p className="text-3xl font-bold text-[var(--error)] mt-1">
                  {isLoading ? '—' : data?.summary?.totalReal ?? 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--error)]/10 rounded-lg">
                <FileWarning className="w-6 h-6 text-[var(--error)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.pages.cspReports.extensionNoise')}</p>
                <p className="text-3xl font-bold text-[var(--text-muted)] mt-1">
                  {isLoading ? '—' : data?.summary?.totalNoise ?? 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--surface-sunken)] rounded-lg">
                <Filter className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.pages.cspReports.blockedResources')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {isLoading ? '—' : data?.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.pages.cspReports.directivesActive')}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {isLoading ? '—' : data?.summary?.byDirective?.length ?? 0}
                </p>
              </div>
              <div className="p-3 bg-[var(--accent-purple)]/10 rounded-lg">
                <Shield className="w-6 h-6 text-[var(--accent-purple)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directive breakdown */}
      {data?.summary?.byDirective && data.summary.byDirective.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              {t('admin.pages.cspReports.violationsByDirective')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.summary.byDirective.map((d) => (
                <button
                  key={d.directive}
                  onClick={() => {
                    setDirective(directive === d.directive ? '' : d.directive);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    directive === d.directive
                      ? 'bg-[var(--primary)] text-[var(--text-primary)]'
                      : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  }`}
                >
                  {d.directive}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {d.count}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="include-noise"
            checked={includeNoise}
            onChange={(e) => {
              setIncludeNoise(e.target.checked);
              setPage(1);
            }}
            className="rounded border-[var(--border)]"
          />
          {t('admin.pages.cspReports.includeNoise')}
        </label>
        {directive && (
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => {
              setDirective('');
              setPage(1);
            }}
          >
            {directive} ✕
          </Badge>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse p-6 space-y-4" role="status">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-[var(--surface-sunken)] rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12" role="alert">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
              <p className="text-[var(--text-primary)]">{t('admin.pages.cspReports.failedToLoad')}</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" onClick={() => mutate()}>
                  {t('admin.pages.cspReports.retry')}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {t('admin.pages.cspReports.refreshPage')}
                </Button>
              </div>
            </div>
          ) : !data || data.reports.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--success)]" />
              <p>{t('admin.pages.cspReports.noViolations')}</p>
              <p className="text-sm mt-1">{t('admin.pages.cspReports.policyWorking')}</p>
              <Button variant="outline" className="mt-4" onClick={() => mutate()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('admin.pages.cspReports.refresh')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">{t('admin.pages.cspReports.type')}</th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">{t('admin.pages.cspReports.blockedUri')}</th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">{t('admin.pages.cspReports.directive')}</th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">{t('admin.pages.cspReports.document')}</th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">{t('admin.pages.cspReports.source')}</th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">{t('admin.pages.cspReports.disposition')}</th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]">
                      <Clock className="w-4 h-4 inline" />
                    </th>
                    <th className="py-3 px-4 font-medium text-[var(--text-secondary)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.reports.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-[var(--border)] hover:bg-[var(--surface-sunken)] transition-colors ${r.isNoise ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4">
                        {r.isNoise ? (
                          <Badge variant="secondary" className="text-xs">{t('admin.pages.cspReports.noise')}</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">{t('admin.pages.cspReports.real')}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <span className="truncate block font-mono text-xs" title={r.blockedUri}>
                          {truncate(r.blockedUri, 35)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="destructive" className="text-xs whitespace-nowrap">
                          {r.violatedDirective}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-[150px]">
                        <span className="truncate block text-xs text-[var(--text-tertiary)]" title={r.documentUri}>
                          {(() => {
                            try {
                              const u = new URL(r.documentUri);
                              return u.pathname || '/';
                            } catch {
                              return r.documentUri ? truncate(r.documentUri, 25) : '—';
                            }
                          })()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {r.sourceFile ? (
                          <span className="text-xs font-mono text-[var(--text-tertiary)]">
                            {truncate(r.sourceFile, 30)}
                            {r.lineNumber != null && `:${r.lineNumber}`}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.disposition === 'enforce'
                              ? 'bg-[var(--error)]/10 text-[var(--error)]'
                              : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          }`}
                        >
                          {r.disposition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon" onClick={() => handleDismissOne(r.id)} title={t('admin.pages.cspReports.dismiss')}>
                          <CheckCircle2 className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--success)]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t('admin.pages.cspReports.pageOf', { page: data.page, totalPages: data.totalPages, total: data.total })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={data.page >= data.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dismiss All Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-[var(--primary)]" />
              {t('admin.pages.cspReports.dismissAllTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.pages.cspReports.dismissAllDesc', { count: data?.total || 0 })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>{t('admin.pages.cspReports.cancel')}</Button>
            <Button variant="default" onClick={handleDismissAll}>
              <CheckCheck className="w-4 h-4 mr-2" /> {t('admin.pages.cspReports.dismissAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
