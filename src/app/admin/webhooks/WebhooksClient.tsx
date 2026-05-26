'use client';

import {
  Webhook,
  Plus,
  Trash2,
  Edit,
  TestTube,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  EyeOff,
} from 'lucide-react';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
import { Switch } from '@/components/ui/Switch';
import { fetcher } from '@/lib/swr-config';

import { AVAILABLE_EVENTS } from '@/core/services/WebhookService';

interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  statusCode: number | null;
  durationMs: number | null;
  createdAt: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
  recentDeliveries?: WebhookDelivery[];
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'success' | 'destructive' | 'warning' | 'default'; icon: React.ElementType }> = {
    SUCCESS: { variant: 'success', icon: CheckCircle },
    FAILED: { variant: 'destructive', icon: XCircle },
    PENDING: { variant: 'warning', icon: Clock },
  };

  const c = config[status] || { variant: 'default' as const, icon: Clock };
  const Icon = c.icon;

  return (
    <Badge variant={c.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
}

export function WebhooksClient() {
  const { data, error, isLoading } = useSWR<{ endpoints: WebhookEndpoint[] }>(
    '/api/admin/webhooks',
    fetcher,
    { refreshInterval: 30000 }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<WebhookEndpoint | null>(null);
  const [showDelete, setShowDelete] = useState<WebhookEndpoint | null>(null);
  const [showDeliveries, setShowDeliveries] = useState<WebhookEndpoint | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [redeliveringId, setRedeliveringId] = useState<string | null>(null);

  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setFormUrl('');
    setFormSecret('');
    setFormDescription('');
    setFormEvents([]);
    setFormActive(true);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!formUrl || formEvents.length === 0) {
      setErrorMsg('URL y al menos un evento son requeridos');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl,
          secret: formSecret || undefined,
          events: formEvents,
          description: formDescription || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear webhook');
      }

      resetForm();
      setShowCreate(false);
      mutate('/api/admin/webhooks');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    if (!formUrl || formEvents.length === 0) {
      setErrorMsg('URL y al menos un evento son requeridos');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const body: Record<string, unknown> = {
        url: formUrl,
        events: formEvents,
        isActive: formActive,
      };
      if (formDescription !== undefined) body.description = formDescription;
      if (formSecret) body.secret = formSecret;

      const res = await fetch(`/api/admin/webhooks/${showEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar webhook');
      }

      setShowEdit(null);
      resetForm();
      mutate('/api/admin/webhooks');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;

    try {
      const res = await fetch(`/api/admin/webhooks/${showDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar webhook');
      }

      setShowDelete(null);
      mutate('/api/admin/webhooks');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleTest = async (endpoint: WebhookEndpoint) => {
    setTestingId(endpoint.id);
    try {
      await fetch(`/api/admin/webhooks/${endpoint.id}/test`, {
        method: 'POST',
      });
      mutate('/api/admin/webhooks');
    } catch {
      // error handled by SWR revalidation
    } finally {
      setTestingId(null);
    }
  };

  const handleRedeliver = async (deliveryId: string) => {
    setRedeliveringId(deliveryId);
    try {
      await fetch('/api/webhooks/outgoing/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId }),
      });
    } catch {
      // ignore
    } finally {
      setRedeliveringId(null);
    }
  };

  const openEdit = (endpoint: WebhookEndpoint) => {
    setFormUrl(endpoint.url);
    setFormSecret('');
    setFormDescription(endpoint.description || '');
    setFormEvents(endpoint.events);
    setFormActive(endpoint.isActive);
    setErrorMsg(null);
    setShowEdit(endpoint);
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-[var(--surface-sunken)] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error al cargar webhooks</h2>
        <Button onClick={() => mutate('/api/admin/webhooks')} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const endpoints = data?.endpoints || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Webhook className="w-6 h-6 text-[var(--primary)]" />
            Webhooks
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gestiona los webhooks salientes para integraciones externas.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Webhook
        </Button>
      </div>

      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No hay webhooks</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Crea tu primer webhook para empezar a recibir eventos.
            </p>
            <Button onClick={() => { resetForm(); setShowCreate(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${endpoint.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'}`} />
                      <h3 className="font-medium text-[var(--text-primary)] truncate">
                        {endpoint.description || endpoint.url}
                      </h3>
                      <Badge variant={endpoint.isActive ? 'success' : 'secondary'}>
                        {endpoint.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)] truncate mb-2">{endpoint.url}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {endpoint.events.map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                      <span>Fallos: {endpoint.failureCount}</span>
                      {endpoint.lastTriggeredAt && (
                        <span>Último: {new Date(endpoint.lastTriggeredAt).toLocaleString()}</span>
                      )}
                      <span>Creado: {new Date(endpoint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTest(endpoint)}
                      disabled={testingId === endpoint.id}
                      title="Probar webhook"
                    >
                      {testingId === endpoint.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeliveries(endpoint)}
                      title="Ver entregas"
                    >
                      <Clock className="w-4 h-4 text-[var(--warning)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(endpoint)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-[var(--primary)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDelete(endpoint)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--error)]" />
                    </Button>
                  </div>
                </div>

                {showDeliveries?.id === endpoint.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-[var(--text-primary)]">
                        Entregas Recientes
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeliveries(null)}
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Ocultar
                      </Button>
                    </div>
                    {endpoint.recentDeliveries && endpoint.recentDeliveries.length > 0 ? (
                      <div className="space-y-2">
                        {endpoint.recentDeliveries.map((delivery) => (
                          <div
                            key={delivery.id}
                            className="flex items-center justify-between p-3 bg-[var(--surface-sunken)] rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <DeliveryStatusBadge status={delivery.status} />
                              <span className="text-sm text-[var(--text-primary)]">{delivery.event}</span>
                              <span className="text-xs text-[var(--text-tertiary)]">
                                {new Date(delivery.createdAt).toLocaleString()}
                              </span>
                              {delivery.statusCode && (
                                <span className="text-xs text-[var(--text-tertiary)]">
                                  HTTP {delivery.statusCode}
                                </span>
                              )}
                              {delivery.durationMs !== null && (
                                <span className="text-xs text-[var(--text-tertiary)]">
                                  {delivery.durationMs}ms
                                </span>
                              )}
                            </div>
                            {delivery.status === 'FAILED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRedeliver(delivery.id)}
                                disabled={redeliveringId === delivery.id}
                              >
                                {redeliveringId === delivery.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                Reintentar
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-tertiary)]">Sin entregas recientes</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nuevo Webhook
            </DialogTitle>
            <DialogDescription>
              Configura un nuevo endpoint para recibir eventos de MangaAura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">URL del Webhook</Label>
              <Input
                id="webhook-url"
                placeholder="https://ejemplo.com/webhook"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="webhook-secret">Secreto (HMAC)</Label>
              <Input
                id="webhook-secret"
                placeholder="Dejar vacío para auto-generar"
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="webhook-desc">Descripción</Label>
              <Input
                id="webhook-desc"
                placeholder="Opcional"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      formEvents.includes(event)
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name={`webhook-event-create-${event}`}
                      checked={formEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        formEvents.includes(event)
                          ? 'border-[var(--primary)] bg-[var(--primary)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {formEvents.includes(event) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[var(--text-primary)]">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                <AlertTriangle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={(open) => { if (!open) setShowEdit(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Webhook
            </DialogTitle>
            <DialogDescription>
              Actualiza la configuración del webhook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-url">URL del Webhook</Label>
              <Input
                id="edit-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-secret">Nuevo Secreto (dejar vacío para mantener)</Label>
              <Input
                id="edit-secret"
                placeholder="Dejar vacío para mantener el actual"
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-desc">Descripción</Label>
              <Input
                id="edit-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--surface-sunken)] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Activo</p>
                <p className="text-xs text-[var(--text-tertiary)]">Habilitar o deshabilitar este webhook</p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <div>
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      formEvents.includes(event)
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name={`webhook-event-edit-${event}`}
                      checked={formEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        formEvents.includes(event)
                          ? 'border-[var(--primary)] bg-[var(--primary)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {formEvents.includes(event) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[var(--text-primary)]">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                <AlertTriangle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={(open) => { if (!open) setShowDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[var(--error)]" />
              Eliminar Webhook
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las entregas asociadas.
            </DialogDescription>
          </DialogHeader>
          {showDelete && (
            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {showDelete.description || showDelete.url}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{showDelete.url}</p>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
