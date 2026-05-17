'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAIService } from '@/hooks/useAIService';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { MetricCard } from '@/components/AI/MetricCard';
import { AlertsPanel } from '@/components/AI/AlertBanner';
import { Badge } from '@/components/ui/Badge';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Layers,
  AlertCircle,
  TrendingUp,
  Cpu,
  Database,
  BarChart3,
  RefreshCw,
  Bell,
} from 'lucide-react';
import {
  ServiceHealth,
  ServiceMetrics,
  QueueStats,
} from '@/infrastructure/ai';
import { ModelRoutingMetrics } from '@/infrastructure/ai/ModelRegistry';

// ============================================================================
// Types
// ============================================================================

interface DashboardData {
  health: ServiceHealth | null;
  metrics: ServiceMetrics | null;
  queueStats: QueueStats | null;
  modelMetrics: ModelRoutingMetrics[];
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' | string }) {
  const variants = {
    healthy: { variant: 'success' as const, icon: CheckCircle, text: 'Healthy' },
    degraded: { variant: 'warning' as const, icon: AlertCircle, text: 'Degraded' },
    unhealthy: { variant: 'destructive' as const, icon: XCircle, text: 'Unhealthy' },
  };

  const config = variants[status as keyof typeof variants] || variants.unhealthy;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1.5 px-3 py-1.5">
      <Icon className="w-3.5 h-3.5" />
      <span className="capitalize">{config.text}</span>
    </Badge>
  );
}

function HealthIndicator({ status }: { status: 'up' | 'down' | string }) {
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${status === 'up' ? 'bg-[var(--success)]' : 'bg-[var(--error)]'} ${status === 'up' ? 'animate-pulse' : ''}`} />
  );
}

function ModelHealthBadge({ status }: { status: string }) {
  const colors = {
    healthy: 'bg-[var(--success)]',
    degraded: 'bg-[var(--warning)]',
    unhealthy: 'bg-[var(--error)]',
    unknown: 'bg-[var(--surface)]0',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${colors[status as keyof typeof colors] || colors.unknown}`} />
      <span className="capitalize text-sm text-[var(--text-primary)]">{status}</span>
    </div>
  );
}

function ProgressBar({
  value,
  total,
  color = 'blue',
  label,
}: {
  value: number;
  total: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  label: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colors = {
    blue: 'bg-[var(--primary)]',
    green: 'bg-[var(--success)]',
    red: 'bg-[var(--error)]',
    yellow: 'bg-[var(--warning)]',
    purple: 'bg-[var(--accent-purple)]',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ComponentStatus({
  name,
  status,
  icon: Icon,
}: {
  name: string;
  status: 'up' | 'down';
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-[var(--surface)]/50 rounded-lg border border-[var(--border)]/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status === 'up' ? 'bg-[var(--surface)]' : 'bg-[var(--error)]/10'}`}>
          <Icon className={`w-4 h-4 ${status === 'up' ? 'text-[var(--text-secondary)]' : 'text-[var(--error)]'}`} />
        </div>
        <span className="text-sm text-[var(--text-primary)]">{name}</span>
      </div>
      <HealthIndicator status={status} />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIServiceDashboardClient() {
  const { getHealth, getMetrics, getQueueStats } = useAIService();
  const { alerts, dismissAlert, acknowledgeAlert } = useAIAlerts();

  const [data, setData] = useState<DashboardData>({
    health: null,
    metrics: null,
    queueStats: null,
    modelMetrics: [],
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  const fetchData = useCallback(() => {
    try {
      const health = getHealth();
      const metrics = getMetrics();
      const queueStats = getQueueStats();

      setData({
        health,
        metrics,
        queueStats,
        modelMetrics: metrics?.models?.models || [],
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching AI service data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getHealth, getMetrics, getQueueStats]);

  // Polling every 2 seconds
  useEffect(() => {
    // Initial fetch
    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const { health, metrics, queueStats, modelMetrics } = data;

  // Calculate derived metrics
  const totalJobs = metrics?.jobs?.total || 0;
  const completedJobs = metrics?.jobs?.completed || 0;
  const failedJobs = metrics?.jobs?.failed || 0;
  const queueDepth = queueStats?.length || 0;
  const processingJobs = queueStats?.processing || 0;

  const throughput = health?.performance?.throughput || 0;
  const avgLatency = health?.performance?.avgLatency || 0;

  const healthyModels = health?.models?.healthy || 0;
  const degradedModels = health?.models?.degraded || 0;
  const unhealthyModels = health?.models?.unhealthy || 0;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">AI Service Dashboard</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Monitor AI service health, performance, and queue metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={health?.status || 'unhealthy'} />
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && showAlerts && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[var(--warning)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Alerts</h2>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Ocultar alertas
              </button>
            </div>
            <AlertsPanel
              alerts={alerts}
              onDismiss={dismissAlert}
              onAcknowledge={acknowledgeAlert}
              title=""
            />
          </div>
        )}

        {/* Alerts Toggle Button (when hidden) */}
        {alerts.length > 0 && !showAlerts && (
          <div className="mb-8">
            <button
              onClick={() => setShowAlerts(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-lg text-[var(--warning)] hover:bg-[var(--warning)]/20 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Mostrar {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}</span>
              {alerts.some(a => a.severity === 'critical') && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-[var(--error)]/20 text-[var(--error)] rounded-full">
                  {alerts.filter(a => a.severity === 'critical').length} crítica{alerts.filter(a => a.severity === 'critical').length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Jobs"
            value={totalJobs.toLocaleString()}
            subtitle="All time processed"
            icon={<Layers className="w-5 h-5" />}
            color="blue"
            loading={isLoading}
          />

          <MetricCard
            title="Completed Jobs"
            value={completedJobs.toLocaleString()}
            subtitle={`${totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}% success rate`}
            trend="up"
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
            loading={isLoading}
          />

          <MetricCard
            title="Failed Jobs"
            value={failedJobs.toLocaleString()}
            subtitle={`${totalJobs > 0 ? ((failedJobs / totalJobs) * 100).toFixed(1) : 0}% error rate`}
            trend={failedJobs > 0 ? 'down' : 'neutral'}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
            loading={isLoading}
          />

          <MetricCard
            title="Queue Depth"
            value={queueDepth}
            subtitle={`${processingJobs} currently processing`}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
            loading={isLoading}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Throughput"
            value={`${throughput.toFixed(1)}`}
            subtitle="Jobs per minute"
            icon={<Zap className="w-5 h-5" />}
            color="purple"
            loading={isLoading}
          />

          <MetricCard
            title="Avg Latency"
            value={`${avgLatency.toFixed(0)}ms`}
            subtitle="Response time"
            icon={<Activity className="w-5 h-5" />}
            color="blue"
            loading={isLoading}
          />

          <MetricCard
            title="Healthy Models"
            value={healthyModels}
            subtitle={`of ${health?.models?.total || 0} registered`}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
            loading={isLoading}
          />

          <MetricCard
            title="Degraded/Unhealthy"
            value={degradedModels + unhealthyModels}
            subtitle={`${degradedModels} degraded, ${unhealthyModels} unhealthy`}
            trend={unhealthyModels > 0 ? 'down' : 'neutral'}
            icon={<AlertCircle className="w-5 h-5" />}
            color={unhealthyModels > 0 ? 'red' : 'yellow'}
            loading={isLoading}
          />
        </div>

        {/* Component Health & Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Component Status */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Component Status</h2>
            </div>
            <div className="space-y-3">
              <ComponentStatus
                name="Job Queue"
                status={health?.components?.queue || 'down'}
                icon={Database}
              />
              <ComponentStatus
                name="Worker Pool"
                status={health?.components?.pool || 'down'}
                icon={Layers}
              />
              <ComponentStatus
                name="Inference Engine"
                status={health?.components?.engine || 'down'}
                icon={Zap}
              />
              <ComponentStatus
                name="Model Registry"
                status={health?.components?.registry || 'down'}
                icon={Cpu}
              />
            </div>
          </div>

          {/* Models Table */}
          <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-[var(--accent-purple)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Models</h2>
              </div>
              <Badge variant="secondary">
                {modelMetrics.length} registered
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">
                      Model
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">
                      Success/Failed
                    </th>
                    <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50">
                  {modelMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[var(--text-tertiary)]">
                        No models registered
                      </td>
                    </tr>
                  ) : (
                    modelMetrics.map((model) => (
                      <tr key={model.modelId} className="hover:bg-[var(--surface-sunken)]/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {model.modelName}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {model.provider} • {model.modelId}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <ModelHealthBadge status={model.healthStatus} />
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-sm">
                            <span className="text-[var(--success)]">{model.successfulRequests}</span>
                            <span className="text-[var(--text-tertiary)] mx-1">/</span>
                            <span className="text-[var(--error)]">{model.failedRequests}</span>
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)]">
                            {(model.successRate * 100).toFixed(1)}% success
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-sm text-[var(--text-primary)]">
                            {model.averageLatencyMs.toFixed(0)}ms
                          </div>
                          {model.lastLatencyMs && (
                            <div className="text-xs text-[var(--text-tertiary)]">
                              Last: {model.lastLatencyMs.toFixed(0)}ms
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Queue Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Queue Stats */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-[var(--warning)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Queue Statistics</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--surface-sunken)]/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {queueStats?.length || 0}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Pending</div>
                </div>
                <div className="bg-[var(--surface-sunken)]/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {queueStats?.processing || 0}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Processing</div>
                </div>
                <div className="bg-[var(--surface-sunken)]/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--success)]">
                    {queueStats?.completed || 0}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Completed</div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Failed Jobs</span>
                  <span className="text-sm text-[var(--error)]">{queueStats?.failed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Avg Wait Time</span>
                  <span className="text-sm text-[var(--text-primary)]">
                    {queueStats?.avgWaitTime ? `${queueStats.avgWaitTime}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs by Priority */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Jobs by Priority</h2>
            </div>

            <div className="space-y-4">
              {queueStats?.byPriority && Object.keys(queueStats.byPriority).length > 0 ? (
                Object.entries(queueStats.byPriority)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([priority, count]) => {
                    const priorityLabels: Record<string, string> = {
                      '10': 'Critical',
                      '5': 'High',
                      '0': 'Normal',
                      '-5': 'Low',
                      '-10': 'Background',
                    };
                    const colors: Record<string, 'red' | 'yellow' | 'blue' | 'purple' | 'green'> = {
                      '10': 'red',
                      '5': 'yellow',
                      '0': 'blue',
                      '-5': 'purple',
                      '-10': 'green',
                    };

                    return (
                      <ProgressBar
                        key={priority}
                        value={count}
                        total={queueStats.length || 1}
                        color={colors[priority] || 'blue'}
                        label={priorityLabels[priority] || `Priority ${priority}`}
                      />
                    );
                  })
              ) : (
                <div className="text-center text-[var(--text-tertiary)] py-8">
                  No jobs in queue
                </div>
              )}
            </div>

            {/* Jobs by Type */}
            {queueStats?.byType && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Jobs by Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(queueStats.byType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 bg-[var(--surface-sunken)]/30 rounded-lg"
                    >
                      <span className="text-sm text-[var(--text-primary)] capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[var(--text-tertiary)]">
          <p>Data refreshes every 2 seconds automatically</p>
        </div>
      </div>
    </div>
  );
}
