'use client';

import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { fetcher } from '@/lib/swr-config';

interface DeliveryItem {
  id: string;
  event: string;
  status: string;
  statusCode: number | null;
  durationMs: number | null;
  attemptCount: number;
  createdAt: string;
  endpointId: string;
  endpoint?: {
    description: string | null;
    url: string;
  } | null;
}

interface DeliveriesResponse {
  deliveries: DeliveryItem[];
  total: number;
  totalPages: number;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'success' | 'destructive' | 'warning'; icon: React.ElementType }> = {
    SUCCESS: { variant: 'success', icon: CheckCircle },
    FAILED: { variant: 'destructive', icon: XCircle },
    PENDING: { variant: 'warning', icon: Clock },
  };

  const c = config[status] || { variant: 'warning' as const, icon: Clock };
  const Icon = c.icon;

  return (
    <Badge variant={c.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
}

export function DeliveriesClient() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, error, isLoading, mutate } = useSWR<DeliveriesResponse>(
    `/api/admin/webhooks/deliveries?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--surface-sunken)] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error al cargar entregas</h2>
        <Button onClick={() => mutate()} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const deliveries = data?.deliveries || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-6 h-6 text-[var(--warning)]" />
            Entregas de Webhooks
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Historial de todas las entregas de webhooks.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Filtrar por estado (SUCCESS, FAILED, PENDING)..."
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value.toUpperCase()); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => { setStatusFilter(''); setPage(1); }}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Entregas <span className="text-[var(--text-tertiary)] font-normal">({data?.total || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              No hay entregas registradas.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Estado
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Evento
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Endpoint
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Código
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Duración
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Intentos
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider pb-3 px-4">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/50">
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-[var(--surface-sunken)]/30 transition-colors">
                        <td className="py-3 px-4">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {delivery.event}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-[var(--text-primary)] truncate max-w-[200px]">
                            {delivery.endpoint?.description || delivery.endpoint?.url || delivery.endpointId}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {delivery.statusCode || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {delivery.durationMs !== null ? `${delivery.durationMs}ms` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {delivery.attemptCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {new Date(delivery.createdAt).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                <div className="text-sm text-[var(--text-tertiary)]">
                  Página {page} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
                    Siguiente
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
