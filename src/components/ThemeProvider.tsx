'use client';

import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { getFaviconDataUri } from '@/components/Logo/faviconUtil';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r, g, b].map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r, g, b].map((c) => Math.round(c * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
}

function hslToRgbString(h: number, s: number, l: number) {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const sn = s / 100;
  const ln = l / 100;
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const r = Math.round(hue2rgb(p, q, h / 360 + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h / 360) * 255);
  const b = Math.round(hue2rgb(p, q, h / 360 - 1/3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

const ORIG_PRIMARY_H = 273;
const LOGO_SHADES = [
  { varName: '--logo-shade-0', h: 274, s: 54, l: 34 },
  { varName: '--logo-shade-1', h: 273, s: 46, l: 46 },
  { varName: '--logo-shade-2', h: 274, s: 61, l: 63 },
  { varName: '--logo-shade-3', h: 276, s: 43, l: 62 },
  { varName: '--logo-shade-4', h: 279, s: 88, l: 81 },
  { varName: '--logo-shade-5', h: 276, s: 89, l: 78 },
  { varName: '--logo-shade-6', h: 274, s: 49, l: 53 },
  { varName: '--logo-shade-7', h: 268, s: 68, l: 4 },
  { varName: '--logo-shade-8', h: 275, s: 38, l: 52 },
  { varName: '--logo-shade-9', h: 289, s: 23, l: 91 },
  { varName: '--logo-shade-10', h: 286, s: 8, l: 61 },
  { varName: '--logo-shade-11', h: 283, s: 8, l: 50 },
];

function applyPrimaryColor(lightColor: string, darkColor: string) {
  console.log('[ThemeProvider] applyPrimaryColor', { lightColor, darkColor });
  const root = document.documentElement;
  const lr = hexToRgb(lightColor);
  const dr = hexToRgb(darkColor);

  const lightHover = darken(lightColor, 0.12);
  const lightSubtle = `rgba(${lr.r}, ${lr.g}, ${lr.b}, 0.1)`;
  const darkHover = lighten(darkColor, 0.1);
  const darkSubtle = `rgba(${dr.r}, ${dr.g}, ${dr.b}, 0.15)`;

  root.style.setProperty('--primary', lightColor);
  root.style.setProperty('--primary-hover', lightHover);
  root.style.setProperty('--primary-subtle', lightSubtle);
  root.style.setProperty('--primary-r', String(lr.r));
  root.style.setProperty('--primary-g', String(lr.g));
  root.style.setProperty('--primary-b', String(lr.b));

  root.style.setProperty('--dark-primary', darkColor);
  root.style.setProperty('--dark-primary-hover', darkHover);
  root.style.setProperty('--dark-primary-subtle', darkSubtle);
  root.style.setProperty('--dark-primary-r', String(dr.r));
  root.style.setProperty('--dark-primary-g', String(dr.g));
  root.style.setProperty('--dark-primary-b', String(dr.b));

  root.style.setProperty('--logo-primary', lightColor);

  const primaryHsl = rgbToHsl(hexToRgb(lightColor).r, hexToRgb(lightColor).g, hexToRgb(lightColor).b);
  const hueShift = primaryHsl.h - ORIG_PRIMARY_H;

  LOGO_SHADES.forEach(({ varName, h, s, l }) => {
    const newH = (((h + hueShift) % 360) + 360) % 360;
    root.style.setProperty(varName, hslToRgbString(newH, s, l));
  });

  const faviconSelector = 'link[rel="icon"][type="image/svg+xml"], link[rel="shortcut icon"][type="image/svg+xml"]';
  const existingFavicon = document.querySelector<HTMLLinkElement>(faviconSelector);
  if (existingFavicon) {
    existingFavicon.href = getFaviconDataUri(lightColor);
  }

  const isDark = root.classList.contains('dark');
  if (isDark) {
    root.style.setProperty('--primary', darkColor);
    root.style.setProperty('--primary-hover', darkHover);
    root.style.setProperty('--primary-subtle', darkSubtle);
    root.style.setProperty('--primary-r', String(dr.r));
    root.style.setProperty('--primary-g', String(dr.g));
    root.style.setProperty('--primary-b', String(dr.b));
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedTheme = localStorage.getItem('mangaaura-theme') as Theme | null;
    if (savedTheme) {
       
      setThemeState(savedTheme);
    }
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      const darkColor = localStorage.getItem('primaryColorDark') || lighten(savedColor, 0.35);
      applyPrimaryColor(savedColor, darkColor);
    } else {
      applyPrimaryColor('#632496', '#b47aff');
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/me/preferences')
      .then((r) => r.json())
      .then((data) => {
        const appearance = data?.preferences?.appearance;
        if (!appearance) return;
        if (appearance.theme) {
          setThemeState(appearance.theme);
          localStorage.setItem('mangaaura-theme', appearance.theme);
        }
        if (appearance.primaryColor) {
          const darkColor = appearance.primaryColorDark || lighten(appearance.primaryColor, 0.35);
          localStorage.setItem('primaryColor', appearance.primaryColor);
          localStorage.setItem('primaryColorDark', darkColor);
          applyPrimaryColor(appearance.primaryColor, darkColor);
        }
        if (appearance.fontSize) {
          localStorage.setItem('fontSize', appearance.fontSize);
          document.documentElement.style.fontSize =
            appearance.fontSize === 'small' ? '14px' : appearance.fontSize === 'large' ? '18px' : '16px';
        }
        if (appearance.layoutDensity) {
          localStorage.setItem('layoutDensity', appearance.layoutDensity);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let newResolvedTheme: 'light' | 'dark';

      if (theme === 'system') {
        newResolvedTheme = systemDark.matches ? 'dark' : 'light';
      } else {
        newResolvedTheme = theme;
      }

      setResolvedTheme(newResolvedTheme);

      if (newResolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      const darkColor = localStorage.getItem('primaryColorDark') || lighten(savedColor, 0.35);
      applyPrimaryColor(savedColor, darkColor);
    }

    // Listen for system theme changes
    const handleChange = (_e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme();
        const c = localStorage.getItem('primaryColor');
        if (c) {
          const dc = localStorage.getItem('primaryColorDark') || lighten(c, 0.35);
          applyPrimaryColor(c, dc);
        }
      }
    };

    systemDark.addEventListener('change', handleChange);
    return () => systemDark.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('mangaaura-theme', newTheme);
  };

  // Prevent hydration mismatch by providing default values during SSR/initial mount
  const contextValue = mounted
    ? { theme, setTheme, resolvedTheme }
    : { theme: 'system' as Theme, setTheme: () => {}, resolvedTheme: 'light' as const };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
