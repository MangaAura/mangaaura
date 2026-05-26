'use client';

import { UserPlus, Mail, XCircle, Clock, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface FieldMetric {
  field: string;
  completionRate: number;
  dropOff: number;
  avgTime: number;
}

interface MethodRate {
  method: string;
  count: number;
  percentage: number;
}

const MOCK_FIELD_METRICS: FieldMetric[] = [
  { field: 'fieldUsername', completionRate: 94, dropOff: 6, avgTime: 12 },
  { field: 'fieldEmail', completionRate: 88, dropOff: 12, avgTime: 8 },
  { field: 'fieldPassword', completionRate: 76, dropOff: 24, avgTime: 18 },
  { field: 'fieldConfirm', completionRate: 82, dropOff: 18, avgTime: 7 },
];

const MOCK_METHOD_RATES: MethodRate[] = [
  { method: 'email', count: 1247, percentage: 58 },
  { method: 'oauth', count: 903, percentage: 42 },
];

export default function SignupAnalyticsPage() {
  const t = useT();
  const s = (key: string) => t(`analytics.signup.${key}`);

  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const totalSignups = useMemo(() => {
    if (period === '7d') return 312;
    if (period === '30d') return MOCK_METHOD_RATES.reduce((a, b) => a + b.count, 0);
    return 5842;
  }, [period]);

  const todaySignups = 18;

  const periodLabel = period === '7d' ? s('last7Days') : period === '30d' ? s('last30Days') : s('today');

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-custom pb-6">
        <div className="flex items-center gap-4">
          <UserPlus size={28} className="text-accent-blue" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{s('title')}</h1>
            <p className="text-muted text-sm mt-1">{periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-tertiary rounded-lg p-1" role="tablist" aria-label="Periodo">
          {(['7d', '30d', 'all'] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-bold transition-all',
                period === p ? 'bg-secondary shadow-sm text-accent-blue' : 'text-muted hover:text-fg-primary'
              )}
            >
              {p === '7d' ? s('last7Days') : p === '30d' ? s('last30Days') : s('today')}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent-blue/10 text-accent-blue">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-muted font-medium">{s('totalSignups')}</p>
              <p className="text-2xl font-extrabold">{totalSignups.toLocaleString('es')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent-green/10 text-[var(--success)]">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-muted font-medium">{s('today')}</p>
              <p className="text-2xl font-extrabold">{todaySignups}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent-orange/10 text-accent-orange">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-muted font-medium">{s('completionRate')}</p>
              <p className="text-2xl font-extrabold">85%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent-purple/10 text-accent-purple">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-muted font-medium">{s('avgTime')}</p>
              <p className="text-2xl font-extrabold">45s</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 size={20} className="text-accent-blue" aria-hidden="true" />
              {s('completionRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {MOCK_FIELD_METRICS.map((metric) => (
                <div key={metric.field}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold">{s(metric.field)}</span>
                    <span className="text-sm font-bold text-[var(--success)]">{metric.completionRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--success)] transition-all"
                      style={{ width: `${metric.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <XCircle size={20} className="text-[var(--error)]" aria-hidden="true" />
              {s('dropOff')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {MOCK_FIELD_METRICS.map((metric) => (
                <div key={metric.field}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold">{s(metric.field)}</span>
                    <span className="text-sm font-bold text-[var(--error)]">{metric.dropOff}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--error)] transition-all"
                      style={{ width: `${metric.dropOff}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock size={20} className="text-accent-orange" aria-hidden="true" />
              {s('avgTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {MOCK_FIELD_METRICS.map((metric) => (
                <div key={metric.field} className="flex items-center justify-between p-3 bg-tertiary rounded-lg">
                  <span className="text-sm font-semibold">{s(metric.field)}</span>
                  <span className="text-sm font-bold text-accent-orange">{metric.avgTime}s</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus size={20} className="text-accent-purple" aria-hidden="true" />
              {s('methodRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {MOCK_METHOD_RATES.map((method) => (
                <div key={method.method}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      {method.method === 'email' ? (
                        <Mail size={16} className="text-accent-blue" />
                      ) : (
                        <Users size={16} className="text-accent-purple" />
                      )}
                      {s(method.method)}
                    </span>
                    <span className="text-sm font-bold">{method.count.toLocaleString('es')} ({method.percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-purple transition-all"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
