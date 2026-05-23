'use client';

import { Eye, MessageCircle, Users, Activity, Globe, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

interface PrivacySettingsProps {
  userId: string;
}

const privacyOptions = [
  {
    id: 'isPublicProfile',
    label: 'Perfil público',
    description: 'Cualquiera puede ver tu perfil y actividad',
    icon: Globe,
    category: 'general',
  },
  {
    id: 'allowMessages',
    label: 'Recibir mensajes directos',
    description: 'Otros usuarios pueden enviarte mensajes',
    icon: MessageCircle,
    category: 'general',
  },
  {
    id: 'showReadingActivity',
    label: 'Mostrar actividad de lectura',
    description: 'Otros pueden ver qué mangas estás leyendo',
    icon: Activity,
    category: 'activity',
  },
  {
    id: 'showCollections',
    label: 'Colecciones públicas',
    description: 'Tus colecciones públicas son visibles',
    icon: Users,
    category: 'content',
  },
];

export function PrivacySettings({}: PrivacySettingsProps) {
  const [settings, setSettings] = useState({
    isPublicProfile: true,
    allowMessages: true,
    showReadingActivity: true,
    showCollections: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [blockedUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/me/preferences')
      .then((r) => r.json())
      .then((data) => {
        if (data?.preferences?.privacy) {
          setSettings((prev) => ({ ...prev, ...data.preferences.privacy }));
          localStorage.setItem('privacySettings', JSON.stringify(data.preferences.privacy));
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('privacySettings');
        if (saved) {
          try { setSettings((prev) => ({ ...prev, ...JSON.parse(saved) })); } catch {}
        }
      });
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setIsDirty(true);
      return updated;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: settings }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const data = await res.json();
      if (data?.preferences?.privacy) {
        localStorage.setItem('privacySettings', JSON.stringify(data.preferences.privacy));
      }
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Visibilidad</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Controla quién puede ver tu información y actividad
        </p>

        <div className="space-y-4">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isEnabled = settings[option.id as keyof typeof settings];

            return (
              <Card
                key={option.id}
                className={cn(
                  'p-4 flex items-start gap-4 transition-colors',
                  isEnabled && 'border-[var(--primary)]/30'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    isEnabled ? 'bg-[var(--primary)]/20' : 'bg-[var(--surface-sunken)]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isEnabled ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={option.id}
                        className="font-medium text-[var(--text-primary)] cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      {option.id === 'isPublicProfile' && (
                        <Badge variant={isEnabled ? 'default' : 'secondary'}>
                          {isEnabled ? 'Público' : 'Privado'}
                        </Badge>
                      )}
                    </div>
                    <Switch
                      id={option.id}
                      checked={isEnabled}
                      onCheckedChange={() =>
                        handleToggle(option.id as keyof typeof settings)
                      }
                    />
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {option.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-[var(--error)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Usuarios bloqueados</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Los usuarios bloqueados no pueden contactarte ni ver tu actividad
        </p>

        {blockedUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[var(--text-secondary)]">No tienes usuarios bloqueados</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <Card key={user.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
                    {user.username[0]}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">@{user.username}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Desbloquear
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isDirty && (
        <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border)]">
          <Button
            variant="outline"
            onClick={() => {
              setSettings({
                isPublicProfile: true,
                allowMessages: true,
                showReadingActivity: true,
                showCollections: true,
              });
              setIsDirty(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  );
}
