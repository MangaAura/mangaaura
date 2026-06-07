import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// I18n mock
const mockT = vi.hoisted(() => (key: string) => {
  const translations: Record<string, string> = {
    'footer.tagline': 'La plataforma de manga definitiva',
    'footer.sectionPlatform': 'Plataforma',
    'footer.sectionSupport': 'Soporte',
    'footer.sectionLegal': 'Legal',
    'footer.help': 'Ayuda',
    'footer.report': 'Reportar',
    'footer.terms': 'Términos',
    'footer.privacy': 'Privacidad',
    'footer.dmca': 'DMCA',
    'footer.termsOfService': 'Términos de servicio',
    'footer.privacyPolicy': 'Política de privacidad',
    'footer.copyright': '© 2025 MangaAura. Todos los derechos reservados.',
    'nav.explore': 'Explorar',
    'nav.rankings': 'Rankings',
    'nav.community': 'Comunidad',
    'nav.library': 'Biblioteca',
  };
  return translations[key] || key;
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

vi.mock('@/i18n', () => ({
  useT: () => mockT,
}));

vi.mock('@/components/ui/RepeatedChar', () => ({
  RepeatedChar: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock('@/components/Logo', () => ({
  LogoSvg: ({ size }: { size?: number }) => <img alt="" width={size} height={size} data-testid="footer-logo" />,
}));

import { Footer } from '@/components/Layout/Footer';

describe('Footer — Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Landmarks', () => {
    it('renders with role="contentinfo"', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveAttribute('role', 'contentinfo');
    });

    it('renders navigation landmarks for each section', () => {
      render(<Footer />);
      const platformNav = screen.getByRole('navigation', { name: 'Plataforma' });
      const supportNav = screen.getByRole('navigation', { name: 'Soporte' });
      const legalNav = screen.getByRole('navigation', { name: 'Legal' });
      expect(platformNav).toBeDefined();
      expect(supportNav).toBeDefined();
      expect(legalNav).toBeDefined();
    });
  });

  describe('Headings', () => {
    it('renders h2 headings for each section', () => {
      render(<Footer />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBeGreaterThanOrEqual(3);

      const labels = headings.map((h) => h.textContent);
      expect(labels).toContain('Plataforma');
      expect(labels).toContain('Soporte');
      expect(labels).toContain('Legal');
    });
  });

  describe('Logo accessibility', () => {
    it('logo image has descriptive alt text', () => {
      render(<Footer />);
      const logo = screen.getByTestId('footer-logo');
      expect(logo).toHaveAttribute('alt', '');
    });
  });

  describe('Social links', () => {
    it('social links have accessible aria-label', () => {
      render(<Footer />);
      // Social links with aria-label
      const x = screen.getByLabelText('X');
      const instagram = screen.getByLabelText('Instagram');
      const tiktok = screen.getByLabelText('TikTok');
      const youtube = screen.getByLabelText('YouTube');
      const discord = screen.getByLabelText('Discord');
      expect(x).toBeDefined();
      expect(instagram).toBeDefined();
      expect(tiktok).toBeDefined();
      expect(youtube).toBeDefined();
      expect(discord).toBeDefined();
    });

    it('social links open in new tab with rel="noopener noreferrer"', () => {
      render(<Footer />);
      const x = screen.getByLabelText('X');
      expect(x).toHaveAttribute('target', '_blank');
      expect(x).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Navigation links', () => {
    it('section links have accessible text content', () => {
      render(<Footer />);
      expect(screen.getByText('Explorar')).toBeDefined();
      expect(screen.getByText('Ayuda')).toBeDefined();
      expect(screen.getByText('Términos')).toBeDefined();
    });

    it('legal links in the bottom bar have accessible text', () => {
      render(<Footer />);
      expect(screen.getByText('Términos de servicio')).toBeDefined();
      expect(screen.getByText('Política de privacidad')).toBeDefined();
      // DMCA appears in both nav section and bottom bar
      const dmcaLinks = screen.getAllByText('DMCA');
      expect(dmcaLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations', async () => {
      const { container } = render(<Footer />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
