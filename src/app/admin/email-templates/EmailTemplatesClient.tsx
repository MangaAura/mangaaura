'use client';

import {
  Mail,
  RotateCcw,
  Save,
  Eye,
  Loader2,
  Check,
  Send,
  User,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface Template {
  key: string; name: string; description: string;
  subject: string; html: string; isCustom: boolean;
}

export default function EmailTemplatesClient() {
  const { handleError } = useErrorHandler();
  const t = useT();
  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

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
        toast({ title: t('admin.pages.emailTemplates.saved'), variant: 'success' });
      } else {
        setSaveStatus('error');
        toast({ title: t('admin.pages.emailTemplates.saveError'), variant: 'destructive' });
      }
    } catch (err) {
      handleError(err);
      setSaveStatus('error');
      toast({ title: t('admin.pages.emailTemplates.saveError'), variant: 'destructive' });
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
        toast({ title: 'Template reset to default', variant: 'success' });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!selectedKey || !testEmail) return;
    setIsTesting(true);
    try {
      const res = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedKey,
          testEmail,
          variables: { siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'MangaAura' },
        }),
      });
      if (res.ok) {
        toast({ title: 'Test email sent', description: `Check ${testEmail} inbox`, variant: 'success' });
        setShowTestDialog(false);
        setTestEmail('');
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to send', variant: 'destructive' });
      }
    } catch (err) {
      handleError(err);
      toast({ title: 'Error', description: 'Failed to send test email', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  const selected = templates.find((t) => t.key === selectedKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Mail className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.emailTemplates.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.emailTemplates.subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.emailTemplates.loadError')}</div>
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
                  {tpl.isCustom && <Badge variant="outline" className="text-[10px]">{t('admin.pages.emailTemplates.edited')}</Badge>}
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
                        <Button variant="outline" size="sm" onClick={() => { setTestEmail(''); setShowTestDialog(true); }}>
                          <Send className="w-4 h-4 mr-1" />
                          Test Send
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving || !selected.isCustom}>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          {t('admin.pages.emailTemplates.reset')}
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          {t('admin.pages.emailTemplates.save')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {saveStatus === 'success' && (
                      <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success)]/10 p-3 rounded-lg">
                        <Check className="w-4 h-4" />
                        {t('admin.pages.emailTemplates.saved')}
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[var(--error)]/10 p-3 rounded-lg">
                        {t('admin.pages.emailTemplates.saveError')}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.emailTemplates.subject')}</label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={t('admin.pages.emailTemplates.subjectPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.emailTemplates.html')}</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewHtml(previewHtml ? null : html)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {previewHtml ? t('admin.pages.emailTemplates.closePreview') : t('admin.pages.emailTemplates.preview')}
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
                          {t('admin.pages.emailTemplates.preview')}
                        </div>
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full h-96 bg-white"
                          title="Preview"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('admin.pages.emailTemplates.availableVars')}</CardTitle>
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
                {t('admin.pages.emailTemplates.selectTemplate')}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[var(--primary)]" />
              Test Send Email
            </DialogTitle>
            <DialogDescription>
              Send a test email using the &quot;{selected?.name}&quot; template to verify how it renders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              The email will be sent with placeholder values for template variables.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTestDialog(false); setTestEmail(''); }}>Cancel</Button>
            <Button onClick={handleTestSend} disabled={!testEmail || isTesting}>
              {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
