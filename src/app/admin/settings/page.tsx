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
  Globe,
  Shield,
  Coins,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Sparkles,
  Banknote,
  Users,
} from 'lucide-react';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  maxUploadSize: number;
  allowedImageTypes: string[];
  defaultLanguage: string;
  enableRegistrations: boolean;
  enableAI: boolean;
  enableCrowdfunding: boolean;
  enableClans: boolean;
  inkcoinsRewardPerChapter: number;
  xpRewardPerChapter: number;
  minimumPayoutAmount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminSettingsPage() {
  const { data, error, isLoading } = useSWR<{ settings: SiteSettings; adminCount: number }>(
    '/api/admin/settings',
    fetcher,
    { revalidateOnFocus: false }
  );

  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings);
    }
  }, [data]);

  const handleChange = (key: keyof SiteSettings, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      mutate('/api/admin/settings');
      setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-[var(--surface-sunken)] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error al cargar la configuración</h2>
        <Button onClick={() => mutate('/api/admin/settings')} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const uploadSizeMB = form.maxUploadSize ? form.maxUploadSize / (1024 * 1024) : 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configuración</h1>
          <p className="text-[var(--text-secondary)] mt-1">Administra la configuración global de InkVerse</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
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
          className={`flex items-center gap-2 p-3 rounded-lg ${
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--primary)]" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName" className="text-[var(--text-secondary)]">Nombre del sitio</Label>
              <Input
                id="siteName"
                value={form.siteName || ''}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="defaultLanguage" className="text-[var(--text-secondary)]">Idioma por defecto</Label>
              <Select
                value={form.defaultLanguage || 'es'}
                onValueChange={(v) => handleChange('defaultLanguage', v)}
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
          </div>
          <div>
            <Label htmlFor="siteDescription" className="text-[var(--text-secondary)]">Descripción del sitio</Label>
            <Textarea
              id="siteDescription"
              value={form.siteDescription || ''}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--warning)]" />
            Seguridad y Acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Modo mantenimiento</p>
              <p className="text-sm text-[var(--text-tertiary)]">Solo administradores pueden acceder al sitio</p>
            </div>
            <Switch
              checked={form.maintenanceMode || false}
              onCheckedChange={(v) => handleChange('maintenanceMode', v)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Registros abiertos</p>
              <p className="text-sm text-[var(--text-tertiary)]">Permitir que nuevos usuarios se registren</p>
            </div>
            <Switch
              checked={form.enableRegistrations ?? true}
              onCheckedChange={(v) => handleChange('enableRegistrations', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--accent-purple)]" />
            Funcionalidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[var(--accent-purple)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">IA</p>
                <p className="text-sm text-[var(--text-tertiary)]">Habilitar funciones de inteligencia artificial</p>
              </div>
            </div>
            <Switch
              checked={form.enableAI ?? true}
              onCheckedChange={(v) => handleChange('enableAI', v)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-[var(--success)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">Crowdfunding</p>
                <p className="text-sm text-[var(--text-tertiary)]">Permitir financiamiento colectivo de capítulos</p>
              </div>
            </div>
            <Switch
              checked={form.enableCrowdfunding ?? true}
              onCheckedChange={(v) => handleChange('enableCrowdfunding', v)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[var(--info)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">Clanes</p>
                <p className="text-sm text-[var(--text-tertiary)]">Permitir creación y participación en clanes</p>
              </div>
            </div>
            <Switch
              checked={form.enableClans ?? true}
              onCheckedChange={(v) => handleChange('enableClans', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--warning)]" />
            Subidas y Economía
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxUploadSize" className="text-[var(--text-secondary)]">
                Tamaño máximo de subida (MB)
              </Label>
              <Input
                id="maxUploadSize"
                type="number"
                min={1}
                max={50}
                value={uploadSizeMB}
                onChange={(e) =>
                  handleChange('maxUploadSize', Number(e.target.value) * 1024 * 1024)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="minimumPayoutAmount" className="text-[var(--text-secondary)]">
                Pago mínimo (InkCoins)
              </Label>
              <Input
                id="minimumPayoutAmount"
                type="number"
                min={100}
                value={form.minimumPayoutAmount || 1000}
                onChange={(e) => handleChange('minimumPayoutAmount', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inkcoinsRewardPerChapter" className="text-[var(--text-secondary)]">
                InkCoins por capítulo leído
              </Label>
              <Input
                id="inkcoinsRewardPerChapter"
                type="number"
                min={0}
                value={form.inkcoinsRewardPerChapter ?? 10}
                onChange={(e) => handleChange('inkcoinsRewardPerChapter', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="xpRewardPerChapter" className="text-[var(--text-secondary)]">
                XP por capítulo leído
              </Label>
              <Input
                id="xpRewardPerChapter"
                type="number"
                min={0}
                value={form.xpRewardPerChapter ?? 25}
                onChange={(e) => handleChange('xpRewardPerChapter', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-[var(--text-secondary)]">Tipos de imagen permitidos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.allowedImageTypes || []).map((type) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-[var(--surface-sunken)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)]"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
