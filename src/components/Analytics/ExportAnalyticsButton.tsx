'use client';

import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { extractApiError } from '@/lib/extract-api-error';

interface ExportAnalyticsButtonProps {
  activeTab?: 'creator' | 'reader';
  dateRange?: { from?: string; to?: string } | null;
}

export function ExportAnalyticsButton({ activeTab = 'reader', dateRange }: ExportAnalyticsButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const generatePDF = useCallback(async (data: Record<string, unknown>[], type: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    let yPos = margin;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(`MangaAura Analytics - ${type}`, margin, yPos);
    yPos += 8;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 10;

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    if (!data || data.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('No data to export', margin, yPos);
      doc.save(`mangaaura-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
      return;
    }

    // Table headers
    const headers = Object.keys(data[0]);
    const colWidth = (pageWidth - margin * 2) / Math.min(headers.length, 4);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    let xPos = margin;

    const visibleHeaders = headers.slice(0, 4);
    for (const header of visibleHeaders) {
      const displayHeader = header
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .substring(0, 20);
      doc.text(displayHeader, xPos + 2, yPos + 4);
      xPos += colWidth;
    }
    yPos += 8;

    // Header background
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos - 6, pageWidth - margin * 2, 6, 'F');
    yPos -= 2;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const maxRows = Math.floor((pageHeight - yPos - 20) / 6);

    for (let i = 0; i < Math.min(data.length, maxRows); i++) {
      const row = data[i];
      xPos = margin;

      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }

      for (let j = 0; j < visibleHeaders.length; j++) {
        let value = String(row[headers[j]] ?? '');
        if (typeof row[headers[j]] === 'object') {
          value = JSON.stringify(row[headers[j]]).substring(0, 20);
        }
        if (value.length > 18) value = value.substring(0, 15) + '...';
        doc.text(value, xPos + 2, yPos + 4);
        xPos += colWidth;
      }
      yPos += 6;
    }

    if (data.length > maxRows) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`... and ${data.length - maxRows} more rows`, margin, yPos + 4);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('MangaAura Analytics Export', margin, pageHeight - 10);
    doc.text(`Generated ${new Date().toISOString().split('T')[0]}`, pageWidth - margin - 40, pageHeight - 10);

    doc.save(`mangaaura-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const type = activeTab === 'creator' ? 'manga' : 'reading';

      if (format === 'pdf') {
        // Fetch JSON data and generate PDF client-side
        const res = await fetch('/api/analytics/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'json',
            type,
            ...(dateRange?.from || dateRange?.to ? { dateRange } : {}),
          }),
        });

        if (!res.ok) {
          const { message } = await extractApiError(res);
          throw new Error(message);
        }

        const data = await res.json();
        const records = Array.isArray(data) ? data : [];
        await generatePDF(records, type);
      } else {
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
          const { message } = await extractApiError(res);
          throw new Error(message);
        }

        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?(.+?)"?$/);
        const filename = match?.[1] || `mangaaura-${type}.${format}`;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast({
        title: 'Error de exportación',
        description: err instanceof Error ? err.message : 'Error al exportar los datos',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [format, activeTab, dateRange, generatePDF]);

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'csv' | 'json' | 'pdf')}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
        aria-label="Formato de exportación"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
        <option value="pdf">PDF</option>
      </select>
      <Button onClick={handleExport} isLoading={isExporting} variant="outline" size="sm">
        <Download className="mr-1.5 h-4 w-4" />
        Exportar
      </Button>
    </div>
  );
}
