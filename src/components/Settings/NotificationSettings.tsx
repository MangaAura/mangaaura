'use client';

import { Mail, Bell, MessageSquare, BookOpen, Trophy, Heart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

interface NotificationSettingsProps {
  userId?: string;
  preferences: {
    newsletter: boolean;
    newFollowers: boolean;
    newComments: boolean;
    chapterUpdates: boolean;
    achievements: boolean;
    marketing: boolean;
  };
}

const notificationTypes = [
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Recibe actualizaciones semanales sobre nuevos mangas y características',
    icon: Mail,
  },
  {
    id: 'newFollowers',
    label: 'Nuevos seguidores',
    description: 'Notificación cuando alguien te sigue',
    icon: Heart,
  },
  {
    id: 'newComments',
    label: 'Comentarios y respuestas',
    description: 'Cuando alguien comenta en tus publicaciones o te responde',
    icon: MessageSquare,
  },
  {
    id: 'chapterUpdates',
    label: 'Nuevos capítulos',
    description: 'Cuando salga un nuevo capítulo de manga que sigues',
    icon: BookOpen,
  },
  {
    id: 'achievements',
    label: 'Logros',
    description: 'Cuando desbloqueas un nuevo logro',
    icon: Trophy,
  },
  {
    id: 'marketing',
    label: 'Ofertas y promociones',
    description: 'Ofertas especiales y promociones de Inkverse',
    icon: Bell,
  },
];

export function NotificationSettings({ preferences }: NotificationSettingsProps) {
  const [settings, setSettings] = useState(preferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailPreferences: settings }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setIsDirty(false);
      alert('Preferencias guardadas');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error al guardar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Preferencias de Notificaciones
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Elige qué notificaciones quieres recibir por email
        </p>
      </div>

      <div className="space-y-4">
        {notificationTypes.map((type) => {
          const Icon = type.icon;
          const isEnabled = settings[type.id as keyof typeof settings];

          return (
            <Card
              key={type.id}
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
                  <Label
                    htmlFor={type.id}
                    className="font-medium text-[var(--text-primary)] cursor-pointer"
                  >
                    {type.label}
                  </Label>
                  <Switch
                    id={type.id}
                    checked={isEnabled}
                    onCheckedChange={() =>
                      handleToggle(type.id as keyof typeof settings)
                    }
                  />
                </div>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">{type.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {isDirty && (
        <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border)]">
          <Button
            variant="outline"
            onClick={() => {
              setSettings(preferences);
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
