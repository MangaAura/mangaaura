'use client';

import { Sun, Moon, Monitor, Check, Palette, Layout, Type, Paintbrush, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { useTheme, type ThemeVariant } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { extractApiError } from '@/lib/extract-api-error';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'normal' | 'large';
type LayoutDensity = 'compact' | 'normal' | 'comfortable';

const DEFAULT_COLOR = '#632496';
const DEFAULT_DARK = '#b47aff';

const PRESET_COLORS = [
  { name: 'MangaAura', light: '#632496', dark: '#b47aff' },
  { name: 'Indigo', light: '#5f5fe8', dark: '#818cf8' },
  { name: 'Violeta', light: '#7c3aed', dark: '#a78bfa' },
  { name: 'Azul', light: '#3b82f6', dark: '#60a5fa' },
  { name: 'Verde', light: '#059669', dark: '#34d399' },
  { name: 'Rojo', light: '#dc2626', dark: '#f87171' },
  { name: 'Rosa', light: '#ec4899', dark: '#f472b6' },
];

/* Manga-paper accent palette — warm earthy tones */
const MANGA_PAPER_ACCENTS = [
  { name: 'Tierra', light: '#8b5e3c', dark: '#b47a5a' },
  { name: 'Arcilla', light: '#a0714f', dark: '#c08a68' },
  { name: 'Musgo', light: '#6b7b3a', dark: '#b8c878' },
  { name: 'Vino', light: '#7a3c5a', dark: '#b88aa8' },
  { name: 'Oxido', light: '#9a4a3a', dark: '#c87a6a' },
  { name: 'Miel', light: '#b0863a', dark: '#d8b86a' },
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
  console.log('[AppearanceSettings] applyPrimaryColor', { lightColor, darkColor });
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

const THEME_VARIANT_KEY = 'mangaaura-theme-variant';

const MANGA_PAPER_LIGHT_PRIMARY = '#8b5e3c';

export function AppearanceSettings() {
  const { theme, setTheme: setThemeProvider, themeVariant, setThemeVariant: setContextThemeVariant } = useTheme();
  const t = useT();
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>('normal');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR);
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync non-context local state from localStorage and API on mount
  useEffect(() => {
    // Initialize from localStorage synchronously on first render
    const savedFontSize = localStorage.getItem('fontSize') as FontSize;
    const savedLayout = localStorage.getItem('layoutDensity') as LayoutDensity;
    const savedColor = localStorage.getItem('primaryColor');

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedLayout) setLayoutDensity(savedLayout);
    if (savedColor) {
      setPrimaryColor(savedColor);
      const storedDark = localStorage.getItem('primaryColorDark');
      const darkColor = storedDark || lighten(savedColor, 0.35);
      applyPrimaryColor(savedColor, darkColor);
    } else if (!savedColor) {
      // Only apply default if no color was ever saved
      const neverSaved = !localStorage.getItem('primaryColor');
      if (neverSaved) {
        applyPrimaryColor(DEFAULT_COLOR, DEFAULT_DARK);
      }
    }

    // Then fetch from API to get server-side values (only for non-context local state)
    fetch('/api/me/preferences')
      .then((r) => r.json())
      .then((data) => {
        const appearance = data?.preferences?.appearance;
        if (!appearance) return;
        if (appearance.fontSize) {
          setFontSize(appearance.fontSize);
          localStorage.setItem('fontSize', appearance.fontSize);
        }
        if (appearance.layoutDensity) {
          setLayoutDensity(appearance.layoutDensity);
          localStorage.setItem('layoutDensity', appearance.layoutDensity);
        }
        if (appearance.primaryColor) {
          setPrimaryColor(appearance.primaryColor);
          const darkColor = appearance.primaryColorDark || lighten(appearance.primaryColor, 0.35);
          localStorage.setItem('primaryColor', appearance.primaryColor);
          localStorage.setItem('primaryColorDark', darkColor);
          applyPrimaryColor(appearance.primaryColor, darkColor);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setThemeProvider(newTheme);
    setIsDirty(true);
  };

  const handlePrimaryColorChange = useCallback((hex: string) => {
    setPrimaryColor(hex);
    setIsDirty(true);
    const lightened = lighten(hex, 0.35);
    localStorage.setItem('primaryColor', hex);
    localStorage.setItem('primaryColorDark', lightened);
    try {
      applyPrimaryColor(hex, lightened);
    } catch (err) {
      console.error('[AppearanceSettings] applyPrimaryColor error:', err);
    }
  }, []);

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    setIsDirty(true);
  };

  useEffect(() => {
    const sizes = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[fontSize];
  }, [fontSize]);

  const handleLayoutChange = (density: LayoutDensity) => {
    setLayoutDensity(density);
    setIsDirty(true);
  };

  const handleThemeVariantChange = (variant: ThemeVariant) => {
    setContextThemeVariant(variant);
    setIsDirty(true);
    if (variant === 'mangaPaper') {
      // Suggest warm primary colors for manga paper theme
      const savedPrimary = localStorage.getItem('primaryColor');
      if (!savedPrimary || savedPrimary === DEFAULT_COLOR) {
        handlePrimaryColorChange(MANGA_PAPER_LIGHT_PRIMARY);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('mangaaura-theme', theme);
      localStorage.setItem(THEME_VARIANT_KEY, themeVariant);
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('layoutDensity', layoutDensity);
      localStorage.setItem('primaryColor', primaryColor);
      localStorage.setItem('primaryColorDark', lighten(primaryColor, 0.35));

      const res = await fetch('/api/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appearance: { theme, themeVariant, fontSize, layoutDensity, primaryColor, primaryColorDark: lighten(primaryColor, 0.35) },
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

      {/* Estilo del tema (variante secundaria) — con preview visual */}
      <div className="pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Estilo de tema</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Elige entre el tema estándar o el estilo papel manga para una experiencia de lectura más cálida y tradicional
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* Standard preview */}
          <button
            onClick={() => handleThemeVariantChange('default')}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all cursor-pointer group',
              themeVariant === 'default'
                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            )}
          >
            {/* Preview card */}
            <div className="w-full h-28 rounded-lg border border-[var(--border)] bg-white dark:bg-[#141414] overflow-hidden mb-3 shadow-sm transition-all duration-200">
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                  <div className="h-2 w-24 rounded bg-[var(--text-tertiary)]/30" />
                </div>
                <div className="h-2 w-full rounded bg-[var(--text-tertiary)]/20" />
                <div className="h-2 w-3/4 rounded bg-[var(--text-tertiary)]/20" />
                <div className="h-2 w-1/2 rounded bg-[var(--text-tertiary)]/20" />
              </div>
            </div>
            <p className={cn(
              'font-medium text-sm',
              themeVariant === 'default' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
            )}>
              {t('theme.variantDefault')}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {t('theme.variantDefaultDesc')}
            </p>
            {themeVariant === 'default' && (
              <Check className="w-4 h-4 mt-2 text-[var(--primary)]" />
            )}
          </button>

          {/* Manga Paper preview */}
          <button
            onClick={() => handleThemeVariantChange('mangaPaper')}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all cursor-pointer group relative overflow-hidden',
              themeVariant === 'mangaPaper'
                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            )}
          >
            {/* Preview card */}
            <div className="w-full h-28 rounded-lg border border-[#cdc0b0] bg-[#f5efe4] dark:bg-[#231d17] dark:border-[#4a3e34] overflow-hidden mb-3 shadow-sm transition-all duration-200">
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#8b5e3c]" />
                  <div className="h-2 w-24 rounded bg-[#8a7a6a]/40 dark:bg-[#9a8a7a]/40" />
                </div>
                <div className="h-2 w-full rounded bg-[#8a7a6a]/30 dark:bg-[#9a8a7a]/30" />
                <div className="h-2 w-3/4 rounded bg-[#8a7a6a]/30 dark:bg-[#9a8a7a]/30" />
                <div className="h-2 w-1/2 rounded bg-[#5c4e3e]/30 dark:bg-[#b8aa98]/30" />
              </div>
            </div>
            <p className={cn(
              'font-medium text-sm',
              themeVariant === 'mangaPaper' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
            )}>
              {t('theme.variantMangaPaper')}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {t('theme.variantMangaPaperDesc')}
            </p>
            {themeVariant === 'mangaPaper' && (
              <Check className="w-4 h-4 mt-2 text-[var(--primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Color primario — con paleta de acentos cálidos si manga-paper está activo */}
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

        {/* Manga-paper accent palette — visible when variant is active */}
        {themeVariant === 'mangaPaper' && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {t('theme.variantAccentTitle')}
            </p>
            <div className="flex flex-wrap gap-2">
              {MANGA_PAPER_ACCENTS.map((accent) => (
                <button
                  key={accent.name}
                  onClick={() => handlePrimaryColorChange(accent.light)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all cursor-pointer',
                    primaryColor === accent.light
                      ? 'border-[var(--text-primary)] scale-110 ring-2 ring-[var(--primary)]/30'
                      : 'border-transparent hover:scale-110'
                  )}
                  style={{ backgroundColor: accent.light }}
                  title={`${accent.name} (${accent.light})`}
                />
              ))}
            </div>
          </div>
        )}

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
          <button
            onClick={() => {
              setPrimaryColor(DEFAULT_COLOR);
              setIsDirty(true);
              localStorage.setItem('primaryColor', DEFAULT_COLOR);
              localStorage.setItem('primaryColorDark', DEFAULT_DARK);
              applyPrimaryColor(DEFAULT_COLOR, DEFAULT_DARK);
            }}
            className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors underline underline-offset-2 cursor-pointer"
          >
            Por defecto
          </button>
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
                  setThemeProvider('dark');
                  setContextThemeVariant('default');
                  setFontSize('normal');
                  setLayoutDensity('normal');
                  setPrimaryColor(DEFAULT_COLOR);
                  localStorage.setItem('fontSize', 'normal');
                  localStorage.setItem('layoutDensity', 'normal');
                  localStorage.removeItem('primaryColor');
                  localStorage.removeItem('primaryColorDark');
                  applyPrimaryColor(DEFAULT_COLOR, DEFAULT_DARK);
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
