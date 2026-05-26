import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

const mockT = vi.hoisted(() => (key: string) => {
  const translations: Record<string, string> = {
    'language.es': 'Español',
    'language.en': 'Inglés',
  };
  return translations[key] || key;
});

const mockSwitchTo = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/es',
}));

vi.mock('@/i18n/index', () => ({
  useLocale: () => ({
    locale: 'es',
    setLocale: mockSwitchTo,
  }),
  useT: () => mockT,
}));

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

describe('LanguageSwitcher — Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Toggle variant (default)', () => {
    it('renders as a button', () => {
      render(<LanguageSwitcher />);
      const button = screen.getByRole('button');
      expect(button).toBeDefined();
    });

    it('has aria-label for the next locale', () => {
      // Current locale is 'es', so next is 'en' = 'Inglés'
      render(<LanguageSwitcher />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Inglés');
    });

    it('has title attribute', () => {
      render(<LanguageSwitcher />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Cambiar idioma');
    });

    it('focus-visible styles are applied', () => {
      render(<LanguageSwitcher />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:outline-none');
      expect(button.className).toContain('focus-visible:ring-2');
    });
  });

  describe('Dropdown variant', () => {
    it('renders two buttons with aria-labels', () => {
      render(<LanguageSwitcher variant="dropdown" />);
      const esButton = screen.getByLabelText('Español');
      const enButton = screen.getByLabelText('Inglés');
      expect(esButton).toBeDefined();
      expect(enButton).toBeDefined();
    });

    it('focus-visible styles are applied on each button', () => {
      render(<LanguageSwitcher variant="dropdown" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.className).toContain('focus-visible:outline-none');
      });
    });
  });

  describe('Flag icons', () => {
    it('flag SVGs have aria-hidden="true"', () => {
      const { container } = render(<LanguageSwitcher />);
      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations in toggle variant', async () => {
      const { container } = render(<LanguageSwitcher />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations in dropdown variant', async () => {
      const { container } = render(<LanguageSwitcher variant="dropdown" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
