'use client';

import {
  Shield,
  Search,
  Loader2,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
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

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  severity: string;
  createdAt: string;
  user?: { id: string; username: string; displayName: string | null } | null;
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
}

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  INFO: <Info className="w-4 h-4" />,
  WARNING: <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />,
  ERROR: <XCircle className="w-4 h-4 text-[var(--error)]" />,
  CRITICAL: <AlertCircle className="w-4 h-4 text-[var(--error)]" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'default',
  WARNING: 'warning',
  ERROR: 'destructive',
  CRITICAL: 'destructive',
};

const ACTION_OPTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_BANNED',
  'USER_UNBANNED',
  'USER_PROMOTED',
  'USER_DEMOTED',
  'MANGA_CREATED',
  'MANGA_UPDATED',
  'MANGA_DELETED',
  'MANGA_HIDDEN',
  'CHAPTER_CREATED',
  'CHAPTER_UPDATED',
  'CHAPTER_DELETED',
  'CHAPTER_HIDDEN',
  'COMMENT_DELETED',
  'COMMENT_HIDDEN',
  'REPORT_ASSIGNED',
  'REPORT_RESOLVED',
  'DMCA_REVIEWED',
  'ADMIN_ACTION',
  'SUSPICIOUS_ACTIVITY',
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(filters: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return `/api/admin/audit-log?${params.toString()}`;
}

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [page, setPage] = useState(0);

  const filters = useMemo(() => ({
    action: filterAction,
    severity: filterSeverity,
    userId: filterUserId,
    limit: '50',
    offset: String(page * 50),
  }), [filterAction, filterSeverity, filterUserId, page]);

  const { data, error, isLoading } = useSWR<AuditLogResponse>(
    buildUrl(filters),
    fetcher,
    { refreshInterval: 15000 }
  );

  const logs = useMemo(() => data?.logs ?? [], [data]);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.targetId?.toLowerCase().includes(q) ||
        l.targetType?.toLowerCase().includes(q) ||
        l.user?.username.toLowerCase().includes(q) ||
        l.user?.displayName?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            Audit Log
          </h1>
          <p className="text-[var(--text-muted)]">Security and administrative event log</p>
        </div>
        <div className="text-sm text-[var(--text-tertiary)]">
          {total} total events
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Filter events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="w-56">
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
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
            <div className="w-48">
              <Input
                placeholder="Filter by user ID..."
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Events <span className="text-[var(--text-tertiary)] font-normal">({filteredLogs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Failed to load audit log</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No audit events found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Target</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-tertiary)]">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-[var(--surface)]">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[var(--text-muted)]">
                            {entry.user?.username || entry.userId || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[var(--text-muted)]">
                            {entry.targetType ? (
                              <span className="text-xs text-[var(--text-tertiary)] mr-1">[{entry.targetType}]</span>
                            ) : null}
                            <span className="font-mono text-xs">{entry.targetId ? entry.targetId.slice(0, 12) + '...' : '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={SEVERITY_COLORS[entry.severity] as 'default' | 'destructive' | 'warning' | 'secondary' | 'outline' | 'success'} className="flex items-center gap-1 w-fit">
                            {SEVERITY_ICONS[entry.severity]}
                            {entry.severity}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
