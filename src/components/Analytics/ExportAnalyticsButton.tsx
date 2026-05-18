'use client';

import { Download } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/Button';

interface ExportAnalyticsButtonProps {
  activeTab?: 'creator' | 'reader';
  dateRange?: { from?: string; to?: string } | null;
}

export function ExportAnalyticsButton({ activeTab = 'reader', dateRange }: ExportAnalyticsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const type = activeTab === 'creator' ? 'manga' : 'reading';
      const res = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          type,
          ...(dateRange?.from || dateRange?.to ? { dateRange } : {}),
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Error al exportar' }));
        throw new Error(error.error || 'Error al exportar');
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match?.[1] || `inkverse-${type}.${format}`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setIsExporting(false);
    }
  }, [format, activeTab, dateRange]);

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
        aria-label="Formato de exportación"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>
      <Button onClick={handleExport} isLoading={isExporting} variant="outline" size="sm">
        <Download className="mr-1.5 h-4 w-4" />
        Exportar
      </Button>
    </div>
  );
}
