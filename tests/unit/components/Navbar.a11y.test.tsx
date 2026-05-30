import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// I18n mock
const mockT = vi.hoisted(() => (key: string) => {
  const translations: Record<string, string> = {
    'common.menu': 'Menú',
    'common.search': 'Buscar',
    'common.more': 'Más',
    'common.close': 'Cerrar',
    'nav.feed': 'Feed',
    'nav.messages': 'Mensajes',
    'nav.collections': 'Colecciones',
    'creator.dashboard': 'Panel de creador',
    'creator.newManga': 'Nuevo manga',
    'a11y.unreadMessages': 'Mensajes no leídos',
    'a11y.skipToContent': 'Saltar al contenido',
  };
  return translations[key] || key;
});

// Mock next/router/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'USER',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock i18n
vi.mock('@/i18n', () => ({
  useT: () => mockT,
}));

// Mock child components
vi.mock('@/components/Layout/SearchBar', () => ({
  SearchBar: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="search-bar" role="search">
      <input type="search" aria-label={placeholder || 'Buscar'} placeholder="Buscar" />
    </div>
  ),
}));

vi.mock('@/components/Layout/AuthSection', () => ({
  AuthSection: () => <div data-testid="auth-section" />,
}));

vi.mock('@/components/Layout/MobileMenu', () => ({
  MobileMenu: ({ open }: { open: boolean }) =>
    open ? <div data-testid="mobile-menu" id="mobile-menu" role="navigation">Mobile Menu</div> : null,
}));

vi.mock('@/components/Layout/NavLinks', () => ({
  NavLinks: ({ links }: { links: { labelKey: string; href: string }[] }) => (
    <>
      {links.map((link) => (
        <a key={link.href} href={link.href}>
          {mockT(link.labelKey)}
        </a>
      ))}
    </>
  ),
  MAIN_NAV_LINKS: [
    { labelKey: 'nav.explore', href: '/explore' },
    { labelKey: 'nav.rankings', href: '/rankings' },
  ],
  MORE_NAV_LINKS: [],
  ALL_NAV_LINKS: [
    { labelKey: 'nav.explore', href: '/explore' },
    { labelKey: 'nav.rankings', href: '/rankings' },
  ],
  isActive: () => false,
  localeHref: (_pathname: string, href: string) => href,
  getLocaleFromPath: () => 'es',
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => (
    <button aria-label="Cambiar idioma">ES</button>
  ),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => (
    <button aria-label="Modo claro">🌙</button>
  ),
}));

vi.mock('@/components/ui/RepeatedChar', () => ({
  RepeatedChar: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} data-testid="logo" />,
}));

// Hooks mocks
vi.mock('@/hooks/useScrolled', () => ({
  useScrolled: () => false,
}));

vi.mock('@/hooks/useUnreadMessages', () => ({
  useUnreadMessages: () => 0,
}));

vi.mock('@/hooks/useUnreadNotifications', () => ({
  useUnreadNotifications: () => 0,
}));

import Navbar from '@/components/Layout/Navbar';

describe('Navbar — Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Landmarks and structure', () => {
    it('renders a <header> element (implicit banner landmark)', () => {
      const { container } = render(<Navbar />);
      const header = container.querySelector('header');
      expect(header).toBeDefined();
    });

    it('renders navigation landmark with aria-label', () => {
      render(<Navbar />);
      const nav = screen.getByRole('navigation', { name: 'Menú' });
      expect(nav).toBeDefined();
    });
  });

  describe('Logo accessibility', () => {
    it('logo image has empty alt text (decorative)', () => {
      render(<Navbar />);
      const logo = screen.getByTestId('logo');
      expect(logo).toHaveAttribute('alt', '');
    });
  });

  describe('Mobile menu button', () => {
    it('mobile menu button has aria-label and aria-expanded', () => {
      render(<Navbar />);
      const menuButton = screen.getByRole('button', { name: 'Menú' });
      expect(menuButton).toBeDefined();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('updates aria-expanded when clicked', () => {
      render(<Navbar />);
      const menuButton = screen.getByRole('button', { name: 'Menú' });
      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAttribute('aria-label', 'Cerrar');
    });
  });

  describe('Quick action links', () => {
    it('feed link has descriptive title', () => {
      render(<Navbar />);
      const feedLink = screen.getByTitle('Feed');
      expect(feedLink).toBeDefined();
    });

    it('new manga button has descriptive title', () => {
      render(<Navbar />);
      const newManga = screen.getByTitle('Nuevo manga');
      expect(newManga).toBeDefined();
    });
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations in initial state', async () => {
      const { container } = render(<Navbar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with mobile menu open', async () => {
      const { container } = render(<Navbar />);
      const menuButton = screen.getByRole('button', { name: 'Menú' });
      fireEvent.click(menuButton);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
