'use client';

import { Flag, AlertTriangle, ShieldAlert, UserX, MessageSquareOff } from 'lucide-react';
import { useState } from 'react';

import { AccessibleModal } from '@/components/A11y/AccessibleModal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT';
  targetId: string;
  targetName: string;
}

const reportReasons = [
  { id: 'spam', label: 'Spam', icon: MessageSquareOff },
  { id: 'harassment', label: 'Acoso', icon: UserX },
  { id: 'inappropriate', label: 'Contenido inapropiado', icon: AlertTriangle },
  { id: 'copyright', label: 'Violación de derechos', icon: ShieldAlert },
  { id: 'other', label: 'Otro', icon: Flag },
];

export function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
          description: description.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  if (submitted) {
    return (
      <AccessibleModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Reporte enviado"
        description={`Gracias por reportar. Revisaremos ${targetName} lo antes posible.`}
        footer={
          <Button onClick={handleClose} className="w-full">
            Entendido
          </Button>
        }
      >
        <div className="flex justify-center py-4">
          <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center">
            <Flag className="w-8 h-8 text-[var(--success)]" aria-hidden="true" />
          </div>
        </div>
      </AccessibleModal>
    );
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reportar"
      description={`¿Por qué quieres reportar ${targetName}?`}
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            variant="destructive"
            isLoading={isSubmitting}
          >
            Reportar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {reportReasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                aria-pressed={selectedReason === reason.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all text-left cursor-pointer',
                  selectedReason === reason.id
                    ? 'border-[var(--error)] bg-[var(--error)]/10'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    selectedReason === reason.id ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    selectedReason === reason.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  {reason.label}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="report-description" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Descripción (opcional)
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Proporciona más detalles..."
            className="w-full h-24 p-3 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            maxLength={500}
            aria-describedby="report-description-count"
          />
          <p id="report-description-count" className="text-xs text-[var(--text-tertiary)] mt-1">
            {description.length}/500 caracteres
          </p>
        </div>
      </div>
    </AccessibleModal>
  );
}

export function useReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    type: 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT';
    id: string;
    name: string;
  } | null>(null);

  const openReport = (type: 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT', id: string, name: string) => {
    setReportData({ type, id, name });
    setIsOpen(true);
  };

  const closeReport = () => {
    setIsOpen(false);
    setReportData(null);
  };

  return {
    isOpen,
    reportData,
    openReport,
    closeReport,
    ReportDialog: reportData ? (
      <ReportDialog
        isOpen={isOpen}
        onClose={closeReport}
        targetType={reportData.type}
        targetId={reportData.id}
        targetName={reportData.name}
      />
    ) : null,
  };
}
