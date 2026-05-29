'use client';

import {
  FileText,
  Shield,
  Search,
  Loader2,
  AlertTriangle,
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
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
import { fetcher } from '@/lib/swr-config';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
  createdAt: string;
  user: { id: string; username: string; email: string; avatarUrl?: string } | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'default', WARNING: 'warning', ERROR: 'destructive', CRITICAL: 'destructive',
};

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  INFO: Info, WARNING: AlertTriangle, ERROR: AlertCircle, CRITICAL: AlertCircle,
};

export default function AuditLogsClient() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [severity, setSeverity] = useState('');
  const [targetType, setTargetType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const limit = 30;
  const params = new URLSearchParams({
    page: String(page), limit: String(limit),
    ...(action && { action }), ...(severity && { severity }), ...(targetType && { targetType }),
  });

  const { data, error, isLoading } = useSWR<{
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    uniqueActions: { action: string; count: number }[];
  }>(`/api/admin/audit-logs?${params}`, fetcher);

  const filteredLogs = data?.logs?.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.action.toLowerCase().includes(q) ||
      l.targetId?.toLowerCase().includes(q) ||
      l.user?.username.toLowerCase().includes(q) ||
      l.ipAddress?.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[var(--primary)]" />
          Audit Log
        </h1>
        <p className="text-[var(--text-muted)]">Historial de acciones administrativas y eventos de seguridad</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Buscar por acción, usuario, IP..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="w-48">
              <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Acción" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {data?.uniqueActions.map((a) => (
                    <SelectItem key={a.action} value={a.action}>{a.action} ({a.count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Severidad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={targetType} onValueChange={(v) => { setTargetType(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Tipo target" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="MANGA">MANGA</SelectItem>
                  <SelectItem value="CHAPTER">CHAPTER</SelectItem>
                  <SelectItem value="COMMENT">COMMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Eventos
            <span className="text-[var(--text-tertiary)] font-normal">
              ({data?.pagination.total || 0} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--error)]">Error al cargar logs</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">No hay eventos registrados</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">Severidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">Target</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const SevIcon = SEVERITY_ICONS[log.severity] || Info;
                      return (
                        <tr key={log.id} className="border-b hover:bg-[var(--surface-sunken)]/50">
                          <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={SEVERITY_COLORS[log.severity] as any} className="flex items-center gap-1 w-fit">
                              <SevIcon className="w-3 h-3" />
                              {log.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-[var(--text-primary)]">{log.action}</span>
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div>
                                <p className="text-sm text-[var(--text-primary)]">{log.user.username}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">{log.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-[var(--text-tertiary)] italic">System</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {log.targetId ? (
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">{log.targetType}</p>
                                <p className="text-xs font-mono text-[var(--text-tertiary)] truncate max-w-[120px]">{log.targetId}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-tertiary)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] font-mono">
                            {log.ipAddress || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Página {page} de {data?.pagination.totalPages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.pagination.totalPages || 1)}>
                    <ChevronRight className="w-4 h-4" />
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
