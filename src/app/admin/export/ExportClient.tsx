'use client';

import {
  Download,
  Database,
  FileJson,
  FileText,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const EXPORT_ENTITIES = [
  { value: 'users', label: 'Usuarios', icon: Database },
  { value: 'mangas', label: 'Mangas', icon: Database },
  { value: 'chapters', label: 'Capítulos', icon: Database },
  { value: 'comments', label: 'Comentarios', icon: Database },
];

export default function ExportClient() {
  const { handleError } = useErrorHandler();
  const [entity, setEntity] = useState('users');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/export?entity=${entity}&format=${format}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match?.[1] || `${entity}-export.${format}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      handleError(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Download className="w-6 h-6 text-[var(--primary)]" />
          Exportar Datos
        </h1>
        <p className="text-[var(--text-muted)]">Exporta datos de la plataforma en formato JSON o CSV</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Seleccionar datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Entidad</label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Seleccionar entidad" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_ENTITIES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              Exportar JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Exportar CSV
            </Button>
          </div>

          <p className="text-sm text-[var(--text-tertiary)]">
            Los archivos se descargarán automáticamente. Las exportaciones grandes pueden tardar unos segundos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
