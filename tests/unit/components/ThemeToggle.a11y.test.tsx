import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

const mockT = vi.hoisted(() => (key: string) => {
  const translations: Record<string, string> = {
    'theme.light': 'Modo claro',
    'theme.dark': 'Modo oscuro',
    'theme.switchToLight': 'Cambiar a modo claro',
    'theme.switchToDark': 'Cambiar a modo oscuro',
  };
  return translations[key] || key;
});

// Mock ThemeProvider context
const mockSetTheme = vi.fn();
let currentTheme = 'dark';

vi.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme: mockSetTheme,
    resolvedTheme: currentTheme,
  }),
}));

vi.mock('@/i18n', () => ({
  useT: () => mockT,
}));

import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle — Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTheme = 'dark';
  });

  it('renders as a button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('has aria-label indicating the next theme', () => {
    // When current theme is dark, clicking switches to light
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Modo claro');
  });

  it('has a title attribute', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Cambiar a modo claro');
  });

  it('updates aria-label when theme changes to light', () => {
    currentTheme = 'light';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Modo oscuro');
  });

  it('calls setTheme with the opposite theme on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('focus-visible styles are applied', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('focus-visible:outline-none');
    expect(button.className).toContain('focus-visible:ring-2');
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations in dark mode', async () => {
      const { container } = render(<ThemeToggle />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations in light mode', async () => {
      currentTheme = 'light';
      const { container } = render(<ThemeToggle />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
