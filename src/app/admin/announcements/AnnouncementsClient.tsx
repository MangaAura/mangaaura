'use client';

import {
  Bell,
  Plus,
  Edit3,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface Announcement {
  id: string; message: string; messageEn?: string; type: string;
  priority: string; style: string; isActive: boolean;
  startAt: string; expiresAt?: string; createdBy: string; createdAt: string; updatedAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info, warning: AlertTriangle, error: AlertCircle, success: CheckCircle,
};

export default function AnnouncementsClient() {
  const t = useT();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);

  const [form, setForm] = useState({
    message: '', messageEn: '', type: 'info', priority: 'normal',
    style: 'banner', isActive: true, startAt: '', expiresAt: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ announcements: Announcement[] }>(
    '/api/admin/announcements', fetcher
  );

  const announcements = data?.announcements || [];

  const openEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setForm({
      message: a.message,
      messageEn: a.messageEn || '',
      type: a.type,
      priority: a.priority,
      style: a.style,
      isActive: a.isActive,
      startAt: a.startAt.slice(0, 16),
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '',
    });
    setFormError(null);
  };

  const resetForm = () => {
    setForm({ message: '', messageEn: '', type: 'info', priority: 'normal', style: 'banner', isActive: true, startAt: '', expiresAt: '' });
    setFormError(null);
  };

  const handleCreate = async () => {
    if (!form.message.trim()) { setFormError('El mensaje es requerido'); return; }
    setIsSaving(true); setFormError(null);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: form.message.trim(),
          messageEn: form.messageEn.trim() || null,
          type: form.type, priority: form.priority, style: form.style,
          isActive: form.isActive,
          startAt: form.startAt ? new Date(form.startAt).toISOString() : new Date().toISOString(),
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      if (res.ok) { await mutate(); setShowCreateDialog(false); resetForm(); toast({ title: 'Announcement created', variant: 'success' }); }
      else { const e = await res.json(); setFormError(e.error || 'Error'); }
    } catch (err) { handleError(err); }
    finally { setIsSaving(false); }
  };

  const handleEdit = async () => {
    if (!editingAnnouncement) return;
    if (!form.message.trim()) { setFormError('El mensaje es requerido'); return; }
    setIsSaving(true); setFormError(null);
    try {
      const res = await fetch(`/api/admin/announcements/${editingAnnouncement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: form.message.trim(),
          messageEn: form.messageEn.trim() || null,
          type: form.type, priority: form.priority, style: form.style,
          isActive: form.isActive,
          startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      if (res.ok) { await mutate(); setEditingAnnouncement(null); toast({ title: 'Announcement updated', variant: 'success' }); }
      else { const e = await res.json(); setFormError(e.error || 'Error'); }
    } catch (err) { handleError(err); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/announcements/${deletingAnnouncement.id}`, { method: 'DELETE' });
      if (res.ok) { await mutate(); setDeletingAnnouncement(null); toast({ title: 'Announcement deleted', variant: 'success' }); }
      else { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
    } catch (err) { handleError(err); }
    finally { setIsDeleting(false); }
  };

  const openPreview = (a: Announcement) => {
    setPreviewAnnouncement(a);
    setShowPreview(true);
  };

  const renderAnnounceDialog = (ann: Announcement | null | undefined, onSave: () => void) => {
    const isEdit = !!ann;
    const open = isEdit ? !!ann : showCreateDialog;
    return (
      <Dialog open={open} onOpenChange={(o) => {
        if (!o) {
          isEdit ? setEditingAnnouncement(null) : setShowCreateDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {isEdit ? t('admin.pages.announcements.edit') : t('admin.pages.announcements.create')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <ErrorMessage message={formError} />}
            <div className="space-y-2">
              <Label>{t('admin.pages.announcements.messageLabel')} *</Label>
              <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={3} placeholder={t('admin.pages.announcements.messagePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.pages.announcements.messageEnLabel')}</Label>
              <Textarea value={form.messageEn} onChange={(e) => setForm((p) => ({ ...p, messageEn: e.target.value }))} rows={2} placeholder="English message (optional)" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('admin.pages.announcements.type')}</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.pages.announcements.priority')}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.pages.announcements.style')}</Label>
                <Select value={form.style} onValueChange={(v) => setForm((p) => ({ ...p, style: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="toast">Toast</SelectItem>
                    <SelectItem value="modal">Modal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('admin.pages.announcements.startAt')}</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.pages.announcements.expiresAt')}</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              <span className="text-sm">{t('admin.pages.announcements.active')}</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { isEdit ? setEditingAnnouncement(null) : setShowCreateDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={onSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? t('admin.pages.announcements.save') : t('admin.pages.announcements.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.announcements.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.announcements.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.pages.announcements.new')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.announcements.loadError')}</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)]">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('admin.pages.announcements.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const TypeIcon = TYPE_ICONS[a.type] || Info;
            return (
              <Card key={a.id} className={!a.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 p-2 rounded-lg ${TYPE_COLORS[a.type] || TYPE_COLORS.info}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[a.type] || TYPE_COLORS.info}`}>
                          {a.type}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] capitalize">{a.priority}</span>
                        {!a.isActive && <Badge variant="destructive" className="text-[10px]">{t('admin.pages.announcements.inactive')}</Badge>}
                      </div>
                      <p className="text-[var(--text-primary)]">{a.message}</p>
                      {a.messageEn && <p className="text-sm text-[var(--text-tertiary)] mt-1">EN: {a.messageEn}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-tertiary)]">
                        <span>{t('admin.pages.announcements.since', { date: new Date(a.startAt).toLocaleString() })}</span>
                        {a.expiresAt && <span>{t('admin.pages.announcements.until', { date: new Date(a.expiresAt).toLocaleString() })}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openPreview(a)} title="Preview"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit3 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingAnnouncement(a)}><Trash2 className="w-4 h-4 text-[var(--error)]" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {renderAnnounceDialog(undefined, handleCreate)}
      {renderAnnounceDialog(editingAnnouncement, handleEdit)}

      <Dialog open={!!deletingAnnouncement} onOpenChange={(o) => { if (!o) setDeletingAnnouncement(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--error)]">
              <Trash2 className="w-5 h-5" />
              {t('admin.pages.announcements.deleteTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[var(--text-muted)]">{t('admin.pages.announcements.deleteDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAnnouncement(null)} disabled={isDeleting}>{t('admin.pages.announcements.cancel') || 'Cancelar'}</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>{t('admin.pages.announcements.deleteButton') || 'Eliminar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Announcement
            </DialogTitle>
          </DialogHeader>
          {previewAnnouncement && (
            <div className="space-y-4 py-2">
              <div className={`p-4 rounded-lg ${TYPE_COLORS[previewAnnouncement.type] || TYPE_COLORS.info}`}>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const PreviewIcon = TYPE_ICONS[previewAnnouncement.type] || Info;
                    return <PreviewIcon className="w-5 h-5" />;
                  })()}
                  <span className="font-medium capitalize">{previewAnnouncement.type}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto capitalize">{previewAnnouncement.priority}</Badge>
                </div>
                <p className="text-sm">{previewAnnouncement.message}</p>
                <p className="text-xs mt-2 opacity-70">
                  Style: {previewAnnouncement.style} | {previewAnnouncement.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Rendered as {previewAnnouncement.style}</h4>
                <div className={`p-3 rounded-lg border ${
                  previewAnnouncement.style === 'banner' ? 'bg-[var(--surface-sunken)] text-center text-sm' :
                  previewAnnouncement.style === 'modal' ? 'bg-[var(--surface)] border-2 shadow-lg text-center' :
                  'bg-[var(--surface-sunken)] border-l-4'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const PI = TYPE_ICONS[previewAnnouncement.type] || Info;
                      return <PI className="w-4 h-4" />;
                    })()}
                    <p className="text-sm font-medium">{previewAnnouncement.message}</p>
                  </div>
                  {previewAnnouncement.messageEn && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">EN: {previewAnnouncement.messageEn}</p>
                  )}
                </div>
              </div>
              <div className="text-xs text-[var(--text-tertiary)] space-y-1">
                <p>Start: {new Date(previewAnnouncement.startAt).toLocaleString()}</p>
                {previewAnnouncement.expiresAt && <p>Expires: {new Date(previewAnnouncement.expiresAt).toLocaleString()}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <EyeOff className="w-4 h-4 mr-2" /> Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
