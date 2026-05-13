'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  User,
  BookOpen,
  CreditCard,
  Coins,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Globe,
  Bell,
  Sparkles,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface CreatorProfile {
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
  socialLinks: Record<string, string>;
}

interface PublishingPrefs {
  defaultLanguage: string;
  defaultStatus: string;
  autoSaveDrafts: boolean;
  notifySubscribers: boolean;
  aiAssistance: boolean;
}

interface PaymentInfo {
  stripeConnected: boolean;
  inkcoinsBalance: number;
  totalTipsReceived: number;
  minimumPayout: number;
}

interface CreatorStats {
  mangaCount: number;
  totalViews: number;
  memberSince: string;
}

interface CreatorSettingsData {
  profile: CreatorProfile;
  publishing: PublishingPrefs;
  payments: PaymentInfo;
  stats: CreatorStats;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CreatorSettingsPage() {
  const { data, error, isLoading } = useSWR<CreatorSettingsData>(
    '/api/creator/settings',
    fetcher,
    { revalidateOnFocus: false }
  );

  const [profile, setProfile] = useState<Partial<CreatorProfile>>({});
  const [publishing, setPublishing] = useState<PublishingPrefs>({
    defaultLanguage: 'es',
    defaultStatus: 'ONGOING',
    autoSaveDrafts: true,
    notifySubscribers: true,
    aiAssistance: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (data?.profile) setProfile(data.profile);
    if (data?.publishing) setPublishing(data.publishing);
  }, [data]);

  const handleProfileChange = (key: keyof CreatorProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  };

  const handlePublishingChange = (key: keyof PublishingPrefs, value: any) => {
    setPublishing((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/creator/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          bio: profile.bio,
          website: profile.website,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      mutate('/api/creator/settings');
      setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[var(--surface-sunken)] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error al cargar la configuración</h2>
        <Button onClick={() => mutate('/api/creator/settings')} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Configuración</h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            Gestiona tu perfil de creador y preferencias
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>

      {saveMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
            saveMessage.type === 'success'
              ? 'bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]'
              : 'bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)]'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--primary-subtle)] rounded-lg">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.stats.mangaCount || 0}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Mangas publicados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--success)]/10 rounded-lg">
              <Eye className="w-5 h-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.stats.totalViews.toLocaleString() || '0'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Vistas totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--warning)]/10 rounded-lg">
              <Coins className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.payments.inkcoinsBalance.toLocaleString() || '0'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">InkCoins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--primary)]" />
            Perfil de Creador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username" className="text-[var(--text-secondary)]">Nombre de usuario</Label>
              <Input
                id="username"
                value={profile.username || ''}
                disabled
                className="mt-1 bg-[var(--surface-sunken)]"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">No se puede cambiar</p>
            </div>
            <div>
              <Label htmlFor="displayName" className="text-[var(--text-secondary)]">Nombre para mostrar</Label>
              <Input
                id="displayName"
                value={profile.displayName || ''}
                onChange={(e) => handleProfileChange('displayName', e.target.value)}
                className="mt-1"
                placeholder="Tu nombre artístico"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-[var(--text-secondary)]">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              disabled
              className="mt-1 bg-[var(--surface-sunken)]"
            />
          </div>
          <div>
            <Label htmlFor="bio" className="text-[var(--text-secondary)]">Biografía</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              className="mt-1"
              rows={4}
              placeholder="Cuéntanos sobre ti y tu obra..."
              maxLength={500}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {(profile.bio || '').length}/500 caracteres
            </p>
          </div>
          <div>
            <Label htmlFor="website" className="text-[var(--text-secondary)]">Sitio web</Label>
            <Input
              id="website"
              value={profile.website || ''}
              onChange={(e) => handleProfileChange('website', e.target.value)}
              className="mt-1"
              placeholder="https://tu-sitio.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--accent-purple)]" />
            Preferencias de Publicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--text-secondary)]">Idioma por defecto</Label>
              <Select
                value={publishing.defaultLanguage}
                onValueChange={(v) => handlePublishingChange('defaultLanguage', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[var(--text-secondary)]">Estado por defecto</Label>
              <Select
                value={publishing.defaultStatus}
                onValueChange={(v) => handlePublishingChange('defaultStatus', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONGOING">En progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="HIATUS">En pausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
              <div>
                <p className="font-medium text-[var(--text-primary)]">Guardado automático</p>
                <p className="text-sm text-[var(--text-tertiary)]">Guardar borradores automáticamente al editar</p>
              </div>
              <Switch
                checked={publishing.autoSaveDrafts}
                onCheckedChange={(v) => handlePublishingChange('autoSaveDrafts', v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[var(--warning)]" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Notificar suscriptores</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Enviar notificación al publicar un capítulo nuevo</p>
                </div>
              </div>
              <Switch
                checked={publishing.notifySubscribers}
                onCheckedChange={(v) => handlePublishingChange('notifySubscribers', v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[var(--accent-purple)]" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Asistencia IA</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Sugerencias de IA al crear contenido</p>
                </div>
              </div>
              <Switch
                checked={publishing.aiAssistance}
                onCheckedChange={(v) => handlePublishingChange('aiAssistance', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--success)]" />
            Pagos y Monetización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data?.payments.stripeConnected ? 'bg-[var(--success)]/10' : 'bg-[var(--warning)]/10'}`}>
                <CreditCard className={`w-5 h-5 ${data?.payments.stripeConnected ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`} />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Stripe</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {data?.payments.stripeConnected
                    ? 'Cuenta conectada'
                    : 'Conecta tu cuenta para recibir pagos'}
                </p>
              </div>
            </div>
            <Button variant={data?.payments.stripeConnected ? 'outline' : 'default'} size="sm">
              {data?.payments.stripeConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1 text-[var(--success)]" />
                  Conectado
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Conectar
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--warning)]/5 rounded-lg border border-[var(--warning)]/20">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-[var(--warning)]" />
                <p className="font-medium text-[var(--text-primary)]">InkCoins</p>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {data?.payments.inkcoinsBalance.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">Balance actual</p>
            </div>
            <div className="p-4 bg-[var(--success)]/5 rounded-lg border border-[var(--success)]/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-[var(--success)]" />
                <p className="font-medium text-[var(--text-primary)]">Propinas recibidas</p>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {data?.payments.totalTipsReceived.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">InkCoins en propinas</p>
            </div>
          </div>
          <div className="p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--text-tertiary)]">
              Pago mínimo para retiro: <span className="font-medium text-[var(--text-primary)]">{data?.payments.minimumPayout.toLocaleString() || '1,000'} InkCoins</span>
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Miembro desde {data?.stats.memberSince ? new Date(data.stats.memberSince).toLocaleDateString('es') : '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
