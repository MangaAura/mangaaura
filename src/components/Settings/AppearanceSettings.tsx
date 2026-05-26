'use client';

import { Sun, Moon, Monitor, Check, Palette, Layout, Type, Paintbrush } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/ThemeProvider';
import { extractApiError } from '@/lib/extract-api-error';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'normal' | 'large';
type LayoutDensity = 'compact' | 'normal' | 'comfortable';

const PRESET_COLORS = [
  { name: 'Indigo', light: '#5f5fe8', dark: '#818cf8' },
  { name: 'Violeta', light: '#7c3aed', dark: '#a78bfa' },
  { name: 'Azul', light: '#3b82f6', dark: '#60a5fa' },
  { name: 'Verde', light: '#059669', dark: '#34d399' },
  { name: 'Rojo', light: '#dc2626', dark: '#f87171' },
  { name: 'Rosa', light: '#ec4899', dark: '#f472b6' },
];

function parseHex(hex: string) {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = parseHex(hex);
  const lr = Math.min(255, r + (255 - r) * amount);
  const lg = Math.min(255, g + (255 - g) * amount);
  const lb = Math.min(255, b + (255 - b) * amount);
  return toHex(lr, lg, lb);
}

function darken(hex: string, amount: number) {
  const { r, g, b } = parseHex(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function hexToRgbValues(hex: string) {
  const { r, g, b } = parseHex(hex);
  return { r, g, b };
}

function applyPrimaryColor(lightColor: string, darkColor: string) {
  const root = document.documentElement;

  const lightRgb = hexToRgbValues(lightColor);
  const darkRgb = hexToRgbValues(darkColor);

  const lightHover = darken(lightColor, 0.12);
  const lightSubtle = `rgba(${lightRgb.r}, ${lightRgb.g}, ${lightRgb.b}, 0.1)`;

  const darkHover = lighten(darkColor, 0.1);
  const darkSubtle = `rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 0.15)`;

  root.style.setProperty('--primary', lightColor);
  root.style.setProperty('--primary-hover', lightHover);
  root.style.setProperty('--primary-subtle', lightSubtle);
  root.style.setProperty('--primary-r', String(lightRgb.r));
  root.style.setProperty('--primary-g', String(lightRgb.g));
  root.style.setProperty('--primary-b', String(lightRgb.b));

  root.style.setProperty('--dark-primary', darkColor);
  root.style.setProperty('--dark-primary-hover', darkHover);
  root.style.setProperty('--dark-primary-subtle', darkSubtle);
  root.style.setProperty('--dark-primary-r', String(darkRgb.r));
  root.style.setProperty('--dark-primary-g', String(darkRgb.g));
  root.style.setProperty('--dark-primary-b', String(darkRgb.b));

  const isDark = root.classList.contains('dark');
  if (isDark) {
    root.style.setProperty('--primary', darkColor);
    root.style.setProperty('--primary-hover', darkHover);
    root.style.setProperty('--primary-subtle', darkSubtle);
    root.style.setProperty('--primary-r', String(darkRgb.r));
    root.style.setProperty('--primary-g', String(darkRgb.g));
    root.style.setProperty('--primary-b', String(darkRgb.b));
  }
}

export function AppearanceSettings() {
  const { setTheme: setThemeProvider } = useTheme();
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>('normal');
  const [primaryColor, setPrimaryColor] = useState('#5f5fe8');
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('mangaaura-theme') as Theme;
    const savedFontSize = localStorage.getItem('fontSize') as FontSize;
    const savedLayout = localStorage.getItem('layoutDensity') as LayoutDensity;
    const savedColor = localStorage.getItem('primaryColor');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedLayout) setLayoutDensity(savedLayout);
    if (savedColor) {
      setPrimaryColor(savedColor);
      const stored = localStorage.getItem('primaryColorDark');
      const darkColor = stored || lighten(savedColor, 0.35);
      applyPrimaryColor(savedColor, darkColor);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeProvider(newTheme);
    setIsDirty(true);
  };

  const handlePrimaryColorChange = useCallback((hex: string) => {
    setPrimaryColor(hex);
    setIsDirty(true);
    const lightened = lighten(hex, 0.35);
    localStorage.setItem('primaryColor', hex);
    localStorage.setItem('primaryColorDark', lightened);
    applyPrimaryColor(hex, lightened);
  }, []);

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
      localStorage.setItem('mangaaura-theme', theme);
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('layoutDensity', layoutDensity);

      const res = await fetch('/api/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appearance: { theme, fontSize, layoutDensity },
        }),
      });

      if (!res.ok) {
        const { message } = await extractApiError(res);
        throw new Error(message);
      }

      setIsDirty(false);
      toast({
        title: 'Guardado',
        description: 'Preferencias guardadas correctamente',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar preferencias',
        variant: 'destructive',
      });
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
          <Paintbrush className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Color primario</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Personaliza el color principal de la aplicación
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePrimaryColorChange(preset.light)}
              className={cn(
                'w-10 h-10 rounded-full border-2 transition-all cursor-pointer',
                primaryColor === preset.light
                  ? 'border-[var(--text-primary)] scale-110'
                  : 'border-transparent hover:scale-110'
              )}
              style={{ backgroundColor: preset.light }}
              title={preset.name}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={primaryColor}
            onChange={(e) => handlePrimaryColorChange(e.target.value)}
            className="w-10 h-10 p-0.5 cursor-pointer border [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md"
          />
          <span className="text-sm text-[var(--text-secondary)] font-mono">
            {primaryColor}
          </span>
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
                  setThemeProvider('dark');
                  setFontSize('normal');
                  setLayoutDensity('normal');
                  setPrimaryColor('#5f5fe8');
                  localStorage.removeItem('primaryColor');
                  localStorage.removeItem('primaryColorDark');
                  applyPrimaryColor('#5f5fe8', '#818cf8');
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
