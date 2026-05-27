'use client';

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  Loader2,
  Server,
  Clock,
  MemoryStick,
} from 'lucide-react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { fetcher } from '@/lib/swr-config';

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function HealthPage() {
  const { data, error, isLoading } = useSWR<{
    status: string;
    timestamp: string;
    uptimeSeconds: number;
    memory: { usedMB: number; totalMB: number; pct: number };
    checks: Record<string, { status: string; latency?: number; error?: string }>;
    stats: { users: number; mangas: number; chapters: number };
  }>('/api/admin/health', fetcher, { refreshInterval: 30000 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error al cargar estado del sistema</h2>
      </div>
    );
  }

  const isHealthy = data?.status === 'healthy';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-6 h-6 text-[var(--primary)]" />
            Health & Status
          </h1>
          <p className="text-[var(--text-muted)]">Estado del sistema y métricas en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-sm px-3 py-1">
            {isHealthy ? '✓ Healthy' : '⚠ Degraded'}
          </Badge>
          <span className="text-sm text-[var(--text-tertiary)]">
            Actualizado: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">Uptime</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {data?.uptimeSeconds ? formatUptime(data.uptimeSeconds) : '—'}
                </p>
              </div>
              <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                <Clock className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">Memoria Heap</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {data?.memory?.usedMB || 0} <span className="text-lg text-[var(--text-tertiary)]">/ {data?.memory?.totalMB || 0} MB</span>
                </p>
                <div className="w-32 h-2 bg-[var(--surface-sunken)] rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(data?.memory?.pct || 0) > 80 ? 'bg-[var(--error)]' : 'bg-[var(--primary)]'}`}
                    style={{ width: `${data?.memory?.pct || 0}%` }}
                  />
                </div>
              </div>
              <div className="p-3 bg-[var(--info)]/10 rounded-lg">
                <MemoryStick className="w-6 h-6 text-[var(--info)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.stats?.users?.toLocaleString() || 0}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Usuarios</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.stats?.mangas?.toLocaleString() || 0}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Mangas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.stats?.chapters?.toLocaleString() || 0}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Capítulos</p>
                </div>
              </div>
              <Server className="w-6 h-6 text-[var(--success)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.checks && Object.entries(data.checks).map(([name, check]) => (
          <Card key={name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {name === 'database' && <Database className="w-5 h-5 text-[var(--primary)]" />}
                  {name === 'redis' && <Server className="w-5 h-5 text-[var(--primary)]" />}
                  <div>
                    <p className="font-medium text-[var(--text-primary)] capitalize">{name}</p>
                    {check.error && <p className="text-xs text-[var(--error)] mt-1">{check.error}</p>}
                    {check.latency && <p className="text-xs text-[var(--text-tertiary)]">Latencia: {check.latency}ms</p>}
                  </div>
                </div>
                <Badge variant={check.status === 'ok' ? 'default' : check.status === 'degraded' ? 'warning' : 'destructive'}>
                  {check.status === 'ok' && <><CheckCircle className="w-3 h-3 mr-1" />OK</>}
                  {check.status === 'degraded' && <><AlertCircle className="w-3 h-3 mr-1" />Degraded</>}
                  {check.status === 'unavailable' && <><AlertCircle className="w-3 h-3 mr-1" />Down</>}
                  {check.status === 'error' && <><AlertCircle className="w-3 h-3 mr-1" />Error</>}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}