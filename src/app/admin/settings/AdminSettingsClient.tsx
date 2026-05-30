'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Shield,
  Settings,
  Coins,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Sparkles,
  Banknote,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';
import { cn } from '@/lib/utils';

interface SiteSettings {
  siteName: string;
  defaultLanguage: string;
  siteDescription: string;
  maintenanceMode: boolean;
  enableRegistrations: boolean;
  enableAI: boolean;
  enableCrowdfunding: boolean;
  enableClans: boolean;
  maxUploadSize: number;
  minimumPayoutAmount: number;
  auraRewardPerChapter: number;
  xpRewardPerChapter: number;
  allowedImageTypes: string[];
}

export default function AdminSettingsClient() {
  const { data, error, isLoading } = useSWR<{ settings: SiteSettings; adminCount: number }>(
    '/api/admin/settings',
    fetcher,
    { revalidateOnFocus: false }
  );

  const t = useT();
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [saving, setSaving] = useState(false);
  const [numberTouched, setNumberTouched] = useState<Record<string, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Use useMemo to derive form state from SWR data without setState in effect
  const effectiveForm = useMemo(() => data?.settings || form, [data?.settings, form]);

  const validateNumber = (key: string, value: number): string | null => {
    switch (key) {
      case 'maxUploadSize':
        if (value < 1) return t('admin.maxUploadSizeMin');
        if (value > 50) return t('admin.maxUploadSizeMax');
        return null;
      case 'minimumPayoutAmount':
        if (value < 100) return t('admin.minimumPayoutMin');
        return null;
      case 'auraRewardPerChapter':
        if (value < 0) return t('admin.auraPerChapterMin');
        return null;
      case 'xpRewardPerChapter':
        if (value < 0) return t('admin.xpPerChapterMin');
        return null;
      default:
        return null;
    }
  };

  const handleChange = (key: keyof SiteSettings, value: any) => {
    // Only update local form state, not SWR data
    setForm(prev => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(effectiveForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      mutate('/api/admin/settings');
      setSaveMessage({ type: 'success', text: t('admin.savedCorrectly') });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || t('admin.errorSavingSettings') });
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
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('admin.errorLoadingSettings')}</h2>
        <Button onClick={() => mutate('/api/admin/settings')} className="mt-4">
          {t('admin.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.configuracion')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">{t('admin.adminSettingsDesc')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t('admin.saveChanges')}
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
            {t('admin.general')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName" className="text-[var(--text-secondary)]">{t('admin.siteName')}</Label>
              <Input
                id="siteName"
                value={effectiveForm.siteName || ''}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="defaultLanguage" className="text-[var(--text-secondary)]">{t('admin.defaultLanguage')}</Label>
              <Select
                value={effectiveForm.defaultLanguage || 'es'}
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
          <div>              <Label htmlFor="siteDescription" className="text-[var(--text-secondary)]">{t('admin.siteDescription')}</Label>
            <Textarea
              id="siteDescription"                value={effectiveForm.siteDescription || ''}
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
            {t('admin.securityAccess')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{t('admin.maintenanceMode')}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{t('admin.maintenanceModeDesc')}</p>
            </div>
            <Switch
              checked={effectiveForm.maintenanceMode || false}
              onCheckedChange={(v) => handleChange('maintenanceMode', v)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{t('admin.registrationsOpen')}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{t('admin.registrationsOpenDesc')}</p>
            </div>
            <Switch
              checked={effectiveForm.enableRegistrations ?? true}
              onCheckedChange={(v) => handleChange('enableRegistrations', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--accent-purple)]" />
            {t('admin.features')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[var(--accent-purple)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">{t('admin.ai')}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.aiDesc')}</p>
              </div>
            </div>
            <Switch
              checked={effectiveForm.enableAI ?? true}
              onCheckedChange={(v) => handleChange('enableAI', v)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-[var(--success)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">{t('admin.crowdfunding')}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.crowdfundingDesc')}</p>
              </div>
            </div>
            <Switch
              checked={effectiveForm.enableCrowdfunding ?? true}
              onCheckedChange={(v) => handleChange('enableCrowdfunding', v)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[var(--info)]" />
              <div>
                <p className="font-medium text-[var(--text-primary)]">{t('admin.clanes')}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{t('admin.clanesDesc')}</p>
              </div>
            </div>
            <Switch
              checked={effectiveForm.enableClans ?? true}
              onCheckedChange={(v) => handleChange('enableClans', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--warning)]" />
            {t('admin.uploadsEconomy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxUploadSize" className="text-[var(--text-secondary)]">
                {t('admin.maxUploadSize')}
              </Label>
              <Input
                id="maxUploadSize"
                type="number"
                min={1}
                max={50}
                value={effectiveForm.maxUploadSize ? effectiveForm.maxUploadSize / (1024 * 1024) : 10}
                onChange={(e) => {
                  handleChange('maxUploadSize', Number(e.target.value) * 1024 * 1024);
                }}
                onBlur={() => setNumberTouched(prev => ({ ...prev, maxUploadSize: true }))}
                className={cn(
                  'mt-1',
                  numberTouched.maxUploadSize && effectiveForm.maxUploadSize != null && (
                    validateNumber('maxUploadSize', effectiveForm.maxUploadSize / (1024 * 1024))
                      ? 'border-[var(--error)]'
                      : 'border-[var(--success)]'
                  )
                )}
              />
              <AnimatePresence>
                {numberTouched.maxUploadSize && effectiveForm.maxUploadSize != null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1"
                  >
                    {(() => {
                      const err = validateNumber('maxUploadSize', effectiveForm.maxUploadSize / (1024 * 1024));
                      const displayVal = effectiveForm.maxUploadSize / (1024 * 1024);
                      if (err && displayVal > 0) {
                        return (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{err}</span>
                          </div>
                        );
                      }
                      if (displayVal > 0) {
                        return (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--success)]">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{t('admin.maxUploadSizeValid')}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <Label htmlFor="minimumPayoutAmount" className="text-[var(--text-secondary)]">
                {t('admin.minimumPayout')}
              </Label>
              <Input
                id="minimumPayoutAmount"
                type="number"
                min={100}
                value={effectiveForm.minimumPayoutAmount || 1000}
                onChange={(e) => handleChange('minimumPayoutAmount', Number(e.target.value))}
                onBlur={() => setNumberTouched(prev => ({ ...prev, minimumPayoutAmount: true }))}
                className={cn(
                  'mt-1',
                  numberTouched.minimumPayoutAmount && effectiveForm.minimumPayoutAmount != null && (
                    validateNumber('minimumPayoutAmount', effectiveForm.minimumPayoutAmount)
                      ? 'border-[var(--error)]'
                      : 'border-[var(--success)]'
                  )
                )}
              />
              <AnimatePresence>
                {numberTouched.minimumPayoutAmount && effectiveForm.minimumPayoutAmount != null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1"
                  >
                    {(() => {
                      const err = validateNumber('minimumPayoutAmount', effectiveForm.minimumPayoutAmount);
                      if (err) {
                        return (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{err}</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-start gap-1.5 text-xs text-[var(--success)]">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{t('admin.minimumPayoutValid')}</span>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="auraRewardPerChapter" className="text-[var(--text-secondary)]">
                {t('admin.auraPerChapter')}
              </Label>
              <Input
                id="auraRewardPerChapter"
                type="number"
                min={0}
                value={effectiveForm.auraRewardPerChapter ?? 10}
                onChange={(e) => handleChange('auraRewardPerChapter', Number(e.target.value))}
                onBlur={() => setNumberTouched(prev => ({ ...prev, auraRewardPerChapter: true }))}
                className={cn(
                  'mt-1',
                  numberTouched.auraRewardPerChapter && effectiveForm.auraRewardPerChapter != null && (
                    validateNumber('auraRewardPerChapter', effectiveForm.auraRewardPerChapter)
                      ? 'border-[var(--error)]'
                      : 'border-[var(--success)]'
                  )
                )}
              />
              <AnimatePresence>
                {numberTouched.auraRewardPerChapter && effectiveForm.auraRewardPerChapter != null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1"
                  >
                    {(() => {
                      const err = validateNumber('auraRewardPerChapter', effectiveForm.auraRewardPerChapter);
                      if (err) {
                        return (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{err}</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-start gap-1.5 text-xs text-[var(--success)]">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{t('admin.auraPerChapterValid')}</span>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <Label htmlFor="xpRewardPerChapter" className="text-[var(--text-secondary)]">
                {t('admin.xpPerChapter')}
              </Label>
              <Input
                id="xpRewardPerChapter"
                type="number"
                min={0}
                value={effectiveForm.xpRewardPerChapter ?? 25}
                onChange={(e) => handleChange('xpRewardPerChapter', Number(e.target.value))}
                onBlur={() => setNumberTouched(prev => ({ ...prev, xpRewardPerChapter: true }))}
                className={cn(
                  'mt-1',
                  numberTouched.xpRewardPerChapter && effectiveForm.xpRewardPerChapter != null && (
                    validateNumber('xpRewardPerChapter', effectiveForm.xpRewardPerChapter)
                      ? 'border-[var(--error)]'
                      : 'border-[var(--success)]'
                  )
                )}
              />
              <AnimatePresence>
                {numberTouched.xpRewardPerChapter && effectiveForm.xpRewardPerChapter != null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1"
                  >
                    {(() => {
                      const err = validateNumber('xpRewardPerChapter', effectiveForm.xpRewardPerChapter);
                      if (err) {
                        return (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{err}</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-start gap-1.5 text-xs text-[var(--success)]">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{t('admin.xpPerChapterValid')}</span>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div>
            <Label className="text-[var(--text-secondary)]">{t('admin.allowedImageTypes')}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(effectiveForm.allowedImageTypes || []).map((type) => (
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
