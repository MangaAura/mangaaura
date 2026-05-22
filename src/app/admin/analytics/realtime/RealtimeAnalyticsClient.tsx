/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Activity,
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  Download,
  Eye,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { RealtimeAnalytics } from '@/types/socket';

async function exportToPDF(
  setExporting: (v: boolean) => void,
  setExportError: (v: string | null) => void,
) {
  try {
    setExporting(true);
    setExportError(null);

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const el = document.getElementById('realtime-analytics-content');
    if (!el) {
      setExportError('Content not found for export.');
      return;
    }

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f172a',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`mangaaura-realtime-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('Error exporting PDF:', err);
    setExportError('Failed to generate PDF. Please try again.');
  } finally {
    setExporting(false);
  }
}

const POLL_INTERVAL = 10000;

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <Activity className={`w-5 h-5 text-[var(--primary)] transition-opacity ${pulse ? 'opacity-100' : 'opacity-60'}`} />
      </div>
      <p className={`text-4xl font-bold text-[var(--text-primary)] mt-2 transition-transform ${pulse ? 'scale-110' : 'scale-100'}`}>
        {value}
      </p>
    </div>
  );
}

function ReadingSessionsTable({ sessions }: { sessions: RealtimeAnalytics['activeSessions'] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-tertiary)]">
        <Eye className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No active readers right now</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">User</th>
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">Manga</th>
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">Chapter</th>
            <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]/50">
          {sessions.map((s) => (
            <tr key={s.userId} className="hover:bg-[var(--surface-sunken)]/30 transition-colors">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] overflow-hidden flex-shrink-0">
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                        {s.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{s.username}</span>
                </div>
              </td>
              <td className="py-3 text-sm text-[var(--text-primary)]">{s.mangaTitle || '—'}</td>
              <td className="py-3 text-sm text-[var(--text-primary)]">
                {s.chapterNumber ? `Ch. ${s.chapterNumber}` : '—'}
                {s.currentPage ? ` • p.${s.currentPage}` : ''}
              </td>
              <td className="py-3 text-right text-sm text-[var(--text-secondary)]">
                {formatTimeAgo(s.lastHeartbeat)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PopularNowCard({ items }: { items: RealtimeAnalytics['popularNow'] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No manga being read right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((manga) => (
        <div key={manga.mangaId} className="flex items-center justify-between p-3 bg-[var(--surface-sunken)]/30 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-14 rounded bg-[var(--surface-sunken)] overflow-hidden flex-shrink-0">
              {manga.coverUrl && (
                <img src={manga.coverUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{manga.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--primary)] flex-shrink-0 ml-3">
            <Users className="w-4 h-4" />
            <span className="font-semibold">{manga.readers}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
          <Icon className="w-4 h-4 text-[var(--primary)]" />
        </div>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-tertiary)] mt-1">{sub}</p>}
    </div>
  );
}

export function RealtimeAnalyticsClient() {
  const [stats, setStats] = useState<RealtimeAnalytics>({
    activeReaders: 0,
    activeReadersChange: 0,
    activeSessions: [],
    popularNow: [],
    readersPerMinute: 0,
    peakToday: 0,
    peakTime: '',
  });
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(window.location.origin, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('analytics:subscribe');
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    });

    socket.on('analytics:stats', (data: RealtimeAnalytics) => {
      setStats(data);
      setLastUpdated(new Date());
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    socketRef.current = socket;
  }, []);

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('analytics:unsubscribe');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [connectSocket]);

  useEffect(() => {
    if (!connected) {
      fallbackIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/admin/analytics/realtime');
          if (res.ok) {
            const data: RealtimeAnalytics = await res.json();
            setStats(data);
            setLastUpdated(new Date());
          }
        } catch {
          // silencio
        }
      }, POLL_INTERVAL);
    }

    return () => {
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [connected]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div id="realtime-analytics-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-live="polite" aria-label="Real-time analytics dashboard">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[var(--primary)]" />
              Real-time Analytics
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Monitor active readers, popular content, and live activity
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => exportToPDF(setExporting, setExportError)}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              {exportError && (
                <p className="text-xs text-[var(--error)]">{exportError}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {connected ? (
                <span className="flex items-center gap-1.5 text-sm text-[var(--success)]">
                  <Wifi className="w-4 h-4" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-[var(--warning)]">
                  <WifiOff className="w-4 h-4" />
                  Polling
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <RefreshCw className={`w-4 h-4 ${connected ? 'animate-spin' : ''}`} />
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Active Readers + Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedCounter value={stats.activeReaders} label="Active Readers" />
          <StatBox
            icon={Activity}
            label="Readers / Minute"
            value={stats.readersPerMinute}
          />
          <StatBox
            icon={TrendingUp}
            label="Peak Today"
            value={stats.peakToday}
            sub={stats.peakTime ? `at ${stats.peakTime}` : undefined}
          />
          <StatBox
            icon={BookOpen}
            label="Manga Being Read"
            value={stats.popularNow.length}
          />
        </div>

        {/* Popular Now + Active Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Popular Now */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-[var(--accent-purple)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Popular Now</h2>
            </div>
            <PopularNowCard items={stats.popularNow} />
          </div>

          {/* Active Reading Sessions */}
          <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Reading Sessions</h2>
              </div>
              <span className="text-xs px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">
                {stats.activeReaders} online
              </span>
            </div>
            <ReadingSessionsTable sessions={stats.activeSessions} />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-[var(--text-tertiary)]">
          <p>Data updates every 5 seconds via WebSocket {!connected && `(fallback: ${POLL_INTERVAL / 1000}s polling)`}</p>
        </div>
      </div>
    </div>
  );
}
