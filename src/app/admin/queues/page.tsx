'use client';

import { useCallback, useEffect, useState } from 'react';

import { Card } from '@/components/ui/Card';

// ============================================================================
// Types
// ============================================================================

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueInfo {
  name: string;
  stats: QueueStats;
  rawStats?: {
    length: number;
    processing: number;
    completed: number;
    failed: number;
    avgWaitTime: number;
    byPriority?: Record<number, number>;
    byType?: Record<string, number>;
  };
}

interface QueueStatsResponse {
  queues: QueueInfo[];
  timestamp: string;
}

// ============================================================================
// Format helpers
// ============================================================================

function fmt(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function getStatusColor(count: number, type: 'waiting' | 'failed' | 'active'): string {
  if (type === 'failed' && count > 0) return 'var(--danger, #ef4444)';
  if (type === 'waiting' && count > 100) return 'var(--warning, #f59e0b)';
  if (type === 'active' && count > 0) return 'var(--success, #22c55e)';
  return 'var(--text-secondary, #64748b)';
}

// ============================================================================
// Queue Stats Card
// ============================================================================

function QueueStatsCard({ queue, onRefresh, onAction, actionLoading, actionMessage }: {
  queue: QueueInfo;
  onRefresh: () => void;
  onAction: (queueName: string, action: string) => void;
  actionLoading: string | null;
  actionMessage: string | null;
}) {
  const { name, stats, rawStats } = queue;
  const totalJobs = stats.waiting + stats.active + stats.completed + stats.failed;
  const isInference = name === 'inference';
  const isBullMQ = ['emails', 'notifications', 'inbound-emails'].includes(name);
  const hasRetry = ['emails', 'notifications'].includes(name);

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold capitalize text-[var(--text-primary)]">{name} Queue</h3>
          {isInference && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)] font-medium">
              Priority
            </span>
          )}
          {!isBullMQ && !isInference && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--info)]/10 text-[var(--info)] font-medium">
              Custom
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isBullMQ && (
            <>
              <button
                onClick={() => onAction(name, 'pause')}
                disabled={actionLoading?.startsWith(name)}
                className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                aria-label="Pause queue"
                title="Pause processing"
              >
                ⏸ Pause
              </button>
              <button
                onClick={() => onAction(name, 'resume')}
                disabled={actionLoading?.startsWith(name)}
                className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                aria-label="Resume queue"
                title="Resume processing"
              >
                ▶ Resume
              </button>
            </>
          )}
          {hasRetry && (
            <button
              onClick={() => onAction(name, 'retry-failed')}
              disabled={actionLoading?.startsWith(name)}
              className="text-xs px-2 py-1 rounded-md bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors disabled:opacity-50"
              aria-label="Retry failed jobs"
              title="Retry all failed jobs"
            >
              ⟳ Retry Failed
            </button>
          )}
          <button
            onClick={() => onAction(name, 'clean')}
            disabled={actionLoading?.startsWith(name)}
            className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
            aria-label="Clean queue"
            title="Remove completed/failed jobs older than 24h"
          >
            {actionLoading === `${name}-clean` ? '⟳ Cleaning...' : '🗑 Clean'}
          </button>
          <button
            onClick={onRefresh}
            className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Refresh stats"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-3 text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] p-2 rounded">
          {actionMessage}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCell label="Waiting" value={fmt(stats.waiting)} color={getStatusColor(stats.waiting, 'waiting')} />
        <StatCell label="Active" value={fmt(stats.active)} color={getStatusColor(stats.active, 'active')} />
        <StatCell label="Completed" value={fmt(stats.completed)} color="var(--text-secondary)" />
        <StatCell label="Failed" value={fmt(stats.failed)} color={getStatusColor(stats.failed, 'failed')} />
        <StatCell label="Delayed" value={fmt(stats.delayed)} color="var(--text-secondary)" />
      </div>

      {/* Inference queue extra stats */}
      {isInference && rawStats && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">Avg wait time</span>
            <span className="font-mono tabular-nums text-[var(--text-primary)]">
              {rawStats.avgWaitTime > 1000
                ? `${(rawStats.avgWaitTime / 1000).toFixed(1)}s`
                : `${rawStats.avgWaitTime}ms`}
            </span>
          </div>
          {rawStats.byPriority && Object.keys(rawStats.byPriority).length > 0 && (
            <div>
              <span className="text-xs text-[var(--text-tertiary)]">By priority: </span>
              <span className="text-xs font-mono tabular-nums text-[var(--text-primary)]">
                {Object.entries(rawStats.byPriority)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([p, c]) => {
                    const labels: Record<string, string> = { '1': 'Critical', '2': 'High', '3': 'Normal', '4': 'Low', '5': 'Bg' };
                    return `${labels[p] || `P${p}`}: ${c}`;
                  })
                  .join(', ')}
              </span>
            </div>
          )}
          {rawStats.byType && Object.keys(rawStats.byType).length > 0 && (
            <div>
              <span className="text-xs text-[var(--text-tertiary)]">By type: </span>
              <span className="text-xs font-mono tabular-nums text-[var(--text-primary)]">
                {Object.entries(rawStats.byType)
                  .filter(([, c]) => c > 0)
                  .map(([t, c]) => `${t}: ${c}`)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-[var(--text-tertiary)]">
        Total jobs tracked: {fmt(totalJobs)}
      </div>
    </Card>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function QueuesAdminPage() {
  const [data, setData] = useState<QueueStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/queues/stats');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized — admin access required');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json: QueueStatsResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAction = useCallback(async (queueName: string, action: string) => {
    const actionId = `${queueName}-${action}`;
    setActionLoading(actionId);
    setActionMessage(null);
    try {
      // Inference queue clean uses the old cleanup endpoint (clears dead letter + persistence)
      const isInferenceClean = queueName === 'inference' && action === 'clean';
      const url = isInferenceClean ? '/api/admin/queues/cleanup' : '/api/admin/queues/action';

      const body = isInferenceClean
        ? undefined
        : JSON.stringify({ queue: queueName, action });

      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setActionMessage(result.message || `${action} completed for ${queueName}`);
      // Refresh stats after action
      setTimeout(() => fetchStats(), 1000);
    } catch (err) {
      setActionMessage(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Queue Monitor</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            BullMQ queue health and statistics
          </p>
        </div>
        {data?.timestamp && (
          <div className="text-xs text-[var(--text-tertiary)] tabular-nums">
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-6 border-[var(--danger)]">
          <div className="flex items-center gap-3">
            <span className="text-lg" role="img" aria-label="error">⚠️</span>
            <div>
              <p className="font-medium text-[var(--danger)]">Monitoring unavailable</p>
              <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="mt-3 text-sm px-3 py-1.5 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Loading state */}
      {loading && !data && !error && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
            <span className="animate-spin">⟳</span>
            Loading queue stats...
          </div>
        </Card>
      )}

      {/* Queue cards */}
      {data?.queues.map((queue) => (
        <QueueStatsCard
          key={queue.name}
          queue={queue}
          onRefresh={fetchStats}
          onAction={triggerAction}
          actionLoading={actionLoading}
          actionMessage={actionMessage}
        />
      ))}

      {/* Empty state */}
      {data && data.queues.length === 0 && (
        <Card className="p-6 text-center text-[var(--text-secondary)]">
          No queues configured.
        </Card>
      )}

      {/* Footer info */}
      <div className="text-xs text-[var(--text-tertiary)] text-center">
        Auto-refresh every 30s &middot; Cron: <code className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded">/api/cron/cleanup-queues</code>
      </div>
    </div>
  );
}
