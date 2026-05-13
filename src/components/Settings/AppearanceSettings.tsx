'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sun, Moon, Monitor, Check, Palette, Layout, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'normal' | 'large';
type LayoutDensity = 'compact' | 'normal' | 'comfortable';

export function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>('normal');
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedFontSize = localStorage.getItem('fontSize') as FontSize;
    const savedLayout = localStorage.getItem('layoutDensity') as LayoutDensity;

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedLayout) setLayoutDensity(savedLayout);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsDirty(true);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    setIsDirty(true);

    const sizes = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[size];
  };

  const handleLayoutChange = (density: LayoutDensity) => {
    setLayoutDensity(density);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('layoutDensity', layoutDensity);

      await fetch('/api/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appearance: { theme, fontSize, layoutDensity },
        }),
      });

      setIsDirty(false);
      alert('Preferencias guardadas');
    } catch (error) {
      console.error('Error saving appearance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const themeOptions = [
    { id: 'light' as Theme, label: 'Claro', icon: Sun },
    { id: 'dark' as Theme, label: 'Oscuro', icon: Moon },
    { id: 'system' as Theme, label: 'Sistema', icon: Monitor },
  ];

  const fontSizeOptions = [
    { id: 'small' as FontSize, label: 'Pequeño', sample: 'Aa' },
    { id: 'normal' as FontSize, label: 'Normal', sample: 'Aa' },
    { id: 'large' as FontSize, label: 'Grande', sample: 'Aa' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Tema</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Elige tu preferencia de tema para toda la aplicación
        </p>

        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                className={cn(
                  'p-4 rounded-lg border-2 text-center transition-all cursor-pointer',
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                <Icon
                  className={cn(
                    'w-8 h-8 mx-auto mb-2',
                    isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
                  )}
                />
                <p
                  className={cn(
                    'font-medium',
                    isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  {option.label}
                </p>
                {isActive && (
                  <Check className="w-4 h-4 mx-auto mt-2 text-[var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Tamaño de texto</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Ajusta el tamaño del texto para mejor legibilidad
        </p>

        <div className="flex gap-4">
          {fontSizeOptions.map((option) => {
            const isActive = fontSize === option.id;
            const sizes = { small: 'text-sm', normal: 'text-base', large: 'text-lg' };

            return (
              <button
                key={option.id}
                onClick={() => handleFontSizeChange(option.id)}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 text-center transition-all cursor-pointer',
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                <span className={cn('font-medium', sizes[option.id])}>
                  {option.sample}
                </span>
                <p
                  className={cn(
                    'text-sm mt-1',
                    isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
                  )}
                >
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Densidad del layout</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Ajusta el espaciado entre elementos
        </p>

        <div className="flex gap-4">
          {[
            { id: 'compact' as LayoutDensity, label: 'Compacto' },
            { id: 'normal' as LayoutDensity, label: 'Normal' },
            { id: 'comfortable' as LayoutDensity, label: 'Amplio' },
          ].map((option) => {
            const isActive = layoutDensity === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleLayoutChange(option.id)}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer',
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded flex flex-col justify-center gap-0.5',
                      option.id === 'compact' && 'gap-0.5',
                      option.id === 'normal' && 'gap-1',
                      option.id === 'comfortable' && 'gap-1.5'
                    )}
                  >
                    <div className="h-1 bg-[var(--border-strong)] rounded w-full" />
                    <div className="h-1 bg-[var(--border-strong)] rounded w-full" />
                    <div className="h-1 bg-[var(--border-strong)] rounded w-2/3" />
                  </div>
                  <p
                    className={cn(
                      'text-sm',
                      isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
                    )}
                  >
                    {option.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isDirty && (
        <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border)]">
          <Button
            variant="outline"
            onClick={() => {
              setTheme('dark');
              setFontSize('normal');
              setLayoutDensity('normal');
              setIsDirty(false);
            }}
          >
            Restaurar defaults
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Guardar preferencias
          </Button>
        </div>
      )}
    </div>
  );
}
