'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AccessibleModal } from '@/components/A11y/AccessibleModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  Eye,
  Flag,
  User,
  BookOpen,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  X,
} from 'lucide-react';

interface Report {
  id: string;
  reportType: string;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  reportedUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  assignedModerator: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
}

interface ReportListProps {
  initialStatus?: string;
  initialPriority?: string;
}

export function ReportList({
  initialStatus,
  initialPriority,
}: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filters, setFilters] = useState({
    status: initialStatus || '',
    priority: initialPriority || '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setReports(data.reports || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (
    reportId: string,
    status: Report['status'],
    resolution?: string
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      });

      if (response.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    const variants: Record<string, string> = {
      PENDING: 'bg-[var(--warning)]/20 text-[var(--warning)]',
      UNDER_REVIEW: 'bg-[var(--info)]/20 text-[var(--info)]',
      RESOLVED: 'bg-[var(--success)]/20 text-[var(--success)]',
      DISMISSED: 'bg-[var(--text-tertiary)]/20 text-[var(--text-tertiary)]',
      ESCALATED: 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]',
    };
    return variants[status] || 'bg-[var(--text-tertiary)]/20 text-[var(--text-tertiary)]';
  };

  const getPriorityBadge = (priority: Report['priority']) => {
    const variants: Record<string, string> = {
      LOW: 'bg-[var(--text-tertiary)]/20 text-[var(--text-tertiary)]',
      MEDIUM: 'bg-[var(--info)]/20 text-[var(--info)]',
      HIGH: 'bg-[var(--accent-orange)]/20 text-[var(--accent-orange)]',
      CRITICAL: 'bg-[var(--error)]/20 text-[var(--error)]',
    };
    return variants[priority] || 'bg-[var(--text-tertiary)]/20 text-[var(--text-tertiary)]';
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return <User className="w-4 h-4" />;
      case 'MANGA':
        return <BookOpen className="w-4 h-4" />;
      case 'COMMENT':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={`report-skeleton-${i}`} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="UNDER_REVIEW">En revisión</option>
          <option value="RESOLVED">Resuelto</option>
          <option value="DISMISSED">Descartado</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) =>
            setFilters((f) => ({ ...f, priority: e.target.value }))
          }
          className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
        >
          <option value="">Todas las prioridades</option>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </select>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="Sin reportes"
          description="No hay reportes pendientes para revisar"
        />
      ) : (
        <>
          <div className="space-y-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="p-4 cursor-pointer hover:border-[var(--primary)]/50 transition-colors"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex -space-x-2">
                    <Avatar className="w-10 h-10 border-2 border-[var(--surface)]">
                      <AvatarImage src={report.reporter.avatarUrl || undefined} />
                      <AvatarFallback className="bg-[var(--surface-sunken)]">
                        {report.reporter.displayName?.[0] ||
                          report.reporter.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    {report.reportedUser && (
                      <Avatar className="w-10 h-10 border-2 border-[var(--surface)]">
                        <AvatarImage
                          src={report.reportedUser.avatarUrl || undefined}
                        />
                        <AvatarFallback className="bg-[var(--surface-sunken)]">
                          {report.reportedUser.displayName?.[0] ||
                            report.reportedUser.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[var(--text-primary)]">
                        {report.reportedUser
                          ? report.reportedUser.displayName ||
                            report.reportedUser.username
                          : 'Contenido'}
                      </span>
                      <span className="text-[var(--text-tertiary)]">reportado por</span>
                      <span className="text-[var(--text-secondary)]">
                        {report.reporter.displayName || report.reporter.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={getStatusBadge(report.status)}>
                        {report.status === 'PENDING' && 'Pendiente'}
                        {report.status === 'UNDER_REVIEW' && 'En revisión'}
                        {report.status === 'RESOLVED' && 'Resuelto'}
                        {report.status === 'DISMISSED' && 'Descartado'}
                        {report.status === 'ESCALATED' && 'Escalado'}
                      </Badge>
                      <Badge className={getPriorityBadge(report.priority)}>
                        {getTargetIcon(report.reportType.split(':')[0])}
                        <span className="ml-1">{report.priority}</span>
                      </Badge>
                      {report.assignedModerator && (
                        <Badge className="bg-[var(--primary)]/20 text-[var(--primary)]">
                          <Shield className="w-3 h-3 mr-1" />
                          {report.assignedModerator.displayName ||
                            report.assignedModerator.username}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-[var(--text-tertiary)] mt-2 line-clamp-1">
                      {report.reason}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>

<Button variant="ghost" size="icon" aria-label="Ver reporte">
            <Eye className="w-5 h-5 text-[var(--text-tertiary)]" />
          </Button>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2 text-[var(--text-secondary)]">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {selectedReport && (
        <AccessibleModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title="Detalle del Reporte"
          footer={
            selectedReport.status === 'PENDING' ||
            selectedReport.status === 'UNDER_REVIEW' ? (
              <div className="flex gap-2 justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
                  isLoading={isUpdating}
                >
                  <X className="w-4 h-4 mr-2" />
                  Descartar
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                  isLoading={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolver
                </Button>
              </div>
            ) : null
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadge(selectedReport.status)}>
                {selectedReport.status}
              </Badge>
              <Badge className={getPriorityBadge(selectedReport.priority)}>
                {selectedReport.priority}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                Motivo
              </h4>
              <p className="text-[var(--text-primary)]">{selectedReport.reason}</p>
            </div>

            {selectedReport.description && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Descripción
                </h4>
                <p className="text-[var(--text-secondary)] text-sm">
                  {selectedReport.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Reportado por
                </h4>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={selectedReport.reporter.avatarUrl || undefined}
                    />
                    <AvatarFallback className="bg-[var(--surface-sunken)] text-xs">
                      {selectedReport.reporter.displayName?.[0] ||
                        selectedReport.reporter.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-[var(--text-primary)]">
                    {selectedReport.reporter.displayName ||
                      selectedReport.reporter.username}
                  </span>
                </div>
              </div>

              {selectedReport.reportedUser && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Usuario reportado
                  </h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={selectedReport.reportedUser.avatarUrl || undefined}
                      />
                      <AvatarFallback className="bg-[var(--surface-sunken)] text-xs">
                        {selectedReport.reportedUser.displayName?.[0] ||
                          selectedReport.reportedUser.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      href={`/user/${selectedReport.reportedUser.username}`}
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                    >
                      {selectedReport.reportedUser.displayName ||
                        selectedReport.reportedUser.username}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AccessibleModal>
      )}
    </>
  );
}
