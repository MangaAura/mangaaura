'use client';

import {
  Mail,
  RotateCcw,
  Save,
  Eye,
  Loader2,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

interface Template {
  key: string; name: string; description: string;
  subject: string; html: string; isCustom: boolean;
}

export default function EmailTemplatesClient() {
  const { handleError } = useErrorHandler();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { data, error, isLoading, mutate } = useSWR<{ templates: Template[] }>(
    '/api/admin/email-templates', fetcher
  );

  const templates = data?.templates || [];

  const selectTemplate = (key: string) => {
    const tpl = templates.find((t) => t.key === key);
    if (tpl) {
      setSelectedKey(key);
      setSubject(tpl.subject);
      setHtml(tpl.html);
      setSaveStatus('idle');
    }
  };

  const handleSave = async () => {
    if (!selectedKey) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selectedKey, subject, html }),
      });
      if (res.ok) {
        setSaveStatus('success');
        await mutate();
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      handleError(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedKey) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selectedKey, subject: '', html: '' }),
      });
      if (res.ok) {
        await mutate();
        const tpl = templates.find((t) => t.key === selectedKey);
        if (tpl) {
          setSubject(tpl.subject);
          setHtml(tpl.html);
        }
        setSaveStatus('success');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const selected = templates.find((t) => t.key === selectedKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Mail className="w-6 h-6 text-[var(--primary)]" />
            Plantillas de Email
          </h1>
          <p className="text-[var(--text-muted)]">Personaliza las plantillas de correo electrónico</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">Error al cargar plantillas</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.key}
                onClick={() => selectTemplate(tpl.key)}
                className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer
                  ${selectedKey === tpl.key
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:bg-[var(--surface)]'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">{tpl.name}</span>
                  {tpl.isCustom && <Badge variant="outline" className="text-[10px]">Editada</Badge>}
                </div>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">{tpl.description}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selected ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selected.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving || !selected.isCustom}>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restaurar
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {saveStatus === 'success' && (
                      <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success)]/10 p-3 rounded-lg">
                        <Check className="w-4 h-4" />
                        Plantilla guardada correctamente
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error)]/10 p-3 rounded-lg">
                        Error al guardar la plantilla
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Asunto</label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Asunto del correo"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">HTML</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewHtml(previewHtml ? null : html)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {previewHtml ? 'Cerrar vista' : 'Vista previa'}
                        </Button>
                      </div>
                      <Textarea
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        rows={16}
                        className="font-mono text-xs"
                      />
                    </div>

                    {previewHtml && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-[var(--surface-sunken)] px-4 py-2 text-xs text-[var(--text-tertiary)] border-b">
                          Vista previa
                        </div>
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full h-96 bg-white"
                          title="Vista previa"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variables disponibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {['{{siteName}}', '{{siteUrl}}', '{{username}}', '{{email}}'].map((v) => (
                        <code key={v} className="px-2 py-1 bg-[var(--surface-sunken)] rounded text-xs">{v}</code>
                      ))}
                      {selectedKey === 'new-chapter' && ['{{mangaTitle}}', '{{chapterNumber}}', '{{chapterTitle}}', '{{chapterUrl}}'].map((v) => (
                        <code key={v} className="px-2 py-1 bg-[var(--surface-sunken)] rounded text-xs">{v}</code>
                      ))}
                      {selectedKey === 'achievement' && ['{{achievementName}}', '{{achievementDescription}}'].map((v) => (
                        <code key={v} className="px-2 py-1 bg-[var(--surface-sunken)] rounded text-xs">{v}</code>
                      ))}
                      {selectedKey === 'password-reset' && ['{{resetUrl}}'].map((v) => (
                        <code key={v} className="px-2 py-1 bg-[var(--surface-sunken)] rounded text-xs">{v}</code>
                      ))}
                      {selectedKey === 'weekly-digest' && ['{{newMangas}}', '{{newChapters}}', '{{readingStreak}}'].map((v) => (
                        <code key={v} className="px-2 py-1 bg-[var(--surface-sunken)] rounded text-xs">{v}</code>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)]">
                Selecciona una plantilla para editar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
