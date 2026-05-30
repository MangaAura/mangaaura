'use client';

import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

function applyPrimaryColor(lightColor: string, darkColor: string) {
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
