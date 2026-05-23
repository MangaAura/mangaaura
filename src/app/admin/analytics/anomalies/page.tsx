'use client';

import {
  AlertTriangle,
  Ban,
  ExternalLink,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  Skull,
  UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface AnomalyEntry {
  id: string;
  userId: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  metadata: string | null;
  severity: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: string; username: string; displayName: string | null } | null;
}

interface AnomaliesResponse {
  logs: AnomalyEntry[];
  total: number;
}

const SEVERITY_CONFIG = {
  INFO: { icon: Shield, color: 'default', label: 'Info' },
  WARNING: { icon: AlertTriangle, color: 'warning', label: 'Warning' },
  ERROR: { icon: ShieldAlert, color: 'destructive', label: 'Error' },
  CRITICAL: { icon: Skull, color: 'destructive', label: 'Critical' },
} as const;

const ANOMALY_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'IMPOSSIBLE_TRAVEL', label: 'Impossible Travel' },
  { value: 'CREDENTIAL_STUFFING', label: 'Credential Stuffing' },
  { value: 'IP_ROTATION', label: 'IP Rotation' },
  { value: 'MULTIPLE_ACCOUNTS', label: 'Multiple Accounts' },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(filters: Record<string, string>) {
  const params = new URLSearchParams({ action: 'SUSPICIOUS_ACTIVITY' });
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return `/api/admin/audit-log?${params.toString()}`;
}

function parseMetadata(metadataStr: string | null): Record<string, unknown> | null {
  if (!metadataStr) return null;
  try {
    return JSON.parse(metadataStr);
  } catch {
    return null;
  }
}

export default function AnomaliesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(0);

  const filters = useMemo(
    () => ({
      severity: filterSeverity,
      limit: '50',
      offset: String(page * 50),
    }),
    [filterSeverity, page]
  );

  const { data, error, isLoading } = useSWR<AnomaliesResponse>(
    buildUrl(filters),
    fetcher,
    { refreshInterval: 15000 }
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filterType) {
      result = result.filter((l) => {
        const meta = parseMetadata(l.metadata);
        return meta?.anomalyType === filterType;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.user?.username.toLowerCase().includes(q) ||
          l.user?.displayName?.toLowerCase().includes(q) ||
          l.userId?.toLowerCase().includes(q) ||
          l.ipAddress?.toLowerCase().includes(q) ||
          l.targetId?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, filterType, searchQuery]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = logs.length;
    const todayCount = logs.filter((l) => new Date(l.createdAt) >= today).length;
    const weekCount = logs.filter((l) => new Date(l.createdAt) >= thisWeek).length;
    const monthCount = logs.filter((l) => new Date(l.createdAt) >= thisMonth).length;
    const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;

    return { total, todayCount, weekCount, monthCount, criticalCount };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[var(--error)]" />
            Anomaly Detection
          </h1>
          <p className="text-[var(--text-muted)]">
            Security anomalies and suspicious activity alerts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">Total</span>
              <ShieldAlert className="w-4 h-4 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">Today</span>
              <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.todayCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">This Week</span>
              <UserCheck className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.weekCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">This Month</span>
              <Shield className="w-4 h-4 text-[var(--accent-blue)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.monthCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">Critical</span>
              <Skull className="w-4 h-4 text-[var(--error)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--error)] mt-1">{stats.criticalCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search by user, IP, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="w-56">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All anomaly types" />
                </SelectTrigger>
                <SelectContent>
                  {ANOMALY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Anomalies{' '}
            <span className="text-[var(--text-tertiary)] font-normal">
              ({filteredLogs.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">
              Failed to load anomalies
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No anomalies detected</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                        Details
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-tertiary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((entry) => {
                      const meta = parseMetadata(entry.metadata);
                      const anomalyType = (meta?.anomalyType as string) || 'UNKNOWN';
                      const details = (meta?.details as string) || '';
                      const SevIcon =
                        SEVERITY_CONFIG[entry.severity as keyof typeof SEVERITY_CONFIG]?.icon ||
                        Shield;
                      const badgeVariant =
                        SEVERITY_CONFIG[entry.severity as keyof typeof SEVERITY_CONFIG]
                          ?.color as 'default' | 'warning' | 'destructive' | 'outline' | 'secondary' | 'success';

                      return (
                        <tr
                          key={entry.id}
                          className="border-b hover:bg-[var(--surface)]"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-[var(--text-tertiary)]">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[var(--text-muted)]">
                              {entry.user?.username || entry.userId?.slice(0, 12) || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {anomalyType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-sm text-[var(--text-muted)] truncate" title={details}>
                              {details}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-[var(--text-tertiary)]">
                              {entry.ipAddress || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={badgeVariant}
                              className="flex items-center gap-1 w-fit"
                            >
                              <SevIcon className="w-3 h-3" />
                              {entry.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {entry.ipAddress && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={`/admin/bans?ip=${encodeURIComponent(entry.ipAddress)}`}
                                    className="flex items-center gap-1"
                                  >
                                    <Ban className="w-3 h-3" />
                                    Ban IP
                                  </a>
                                </Button>
                              )}
                              {entry.userId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={`/admin/users/${entry.userId}`}
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    User
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-[var(--text-tertiary)]">
                  Page {page + 1} of {totalPages || 1}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
