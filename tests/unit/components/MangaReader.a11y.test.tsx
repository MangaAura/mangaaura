import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock next-auth/react to provide session context
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: 'user-1', name: 'Test User', email: 'test@inkverse.app' },
      expires: '2026-01-01',
    },
    status: 'authenticated',
  })),
  SessionProvider: vi.fn(({ children }: { children: React.ReactNode }) => children),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock next/link to render as anchor
vi.mock('next/link', () => ({
  default: vi.fn(({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )),
}));

// Mock next/image — must be a regular function so `new Image()` works in MangaReader
vi.mock('next/image', () => {
  // Regular function declaration can be used with `new` operator.
  // Handles both: new Image() (preloading, no props) and <Image .../> (React render).
  function MockNextImage(props?: Record<string, unknown>) {
    // new Image() case — no props, just return an empty object as instance
    if (!props) {
      this.src = '';
      this.onload = null;
      this.onerror = null;
      return;
    }
    // React render case
    const { fill, width, height, alt, ...rest } = props;
    const imgProps: Record<string, unknown> = { alt: alt as string, ...rest };
    if (fill) {
      imgProps.style = { position: 'absolute', inset: 0, objectFit: 'contain' };
    } else if (width && height) {
      imgProps.width = width;
      imgProps.height = height;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    return React.createElement('img', imgProps);
  }
  return { default: MockNextImage };
});

// Mock OptimizedImage
vi.mock('@/components/Image/OptimizedImage', () => ({
  OptimizedImage: vi.fn((props: Record<string, unknown>) => {
    const imgProps: Record<string, unknown> = {};
    if (props.onClick) imgProps.onClick = props.onClick;
    if (props.alt) imgProps.alt = props.alt;
    if (props.src) imgProps.src = props.src;
    if (props.onLoad) imgProps.onLoad = props.onLoad;
    return <img {...imgProps} />;
  }),
}));

// Mock framer-motion (inline createElement to avoid extra React import)
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const React = require('react');
      return React.createElement('div', props, children);
    }),
    button: vi.fn(({ children, ...props }: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const React = require('react');
      return React.createElement('button', props, children);
    }),
  },
  AnimatePresence: vi.fn(({ children }: { children: React.ReactNode }) => children),
}));

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: vi.fn(() => {
    const MockComponent = vi.fn(() => null);
    (MockComponent as ReturnType<typeof vi.fn> & { displayName?: string }).displayName = 'MockedDynamic';
    return MockComponent;
  }),
}));

// Mock hooks
vi.mock('@/hooks/useReadingProgress', () => ({
  useAutoSaveProgress: vi.fn(),
}));

// Mock the Button component
vi.mock('@/components/ui/Button', () => ({
  Button: vi.fn(({ children, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    return React.createElement('button', props, children);
  }),
}));

import { MangaReader } from '@/components/Reader/MangaReader';

const mockPages = ['/page1.jpg', '/page2.jpg', '/page3.jpg'];

describe('MangaReader — Accessibility', () => {
  const defaultProps = {
    pages: mockPages,
    chapterNumber: 1,
    mangaTitle: 'Test Manga',
    mangaSlug: 'test-manga',
    mangaId: 'manga-1',
    chapterId: 'chapter-1',
    totalChapters: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the progressbar with correct ARIA role and attributes', () => {
    render(<MangaReader {...defaultProps} />);

    const progressbar = screen.getByRole('progressbar', {
      name: /progreso de lectura/i,
    });
    expect(progressbar).toBeDefined();
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow');
  });

  it('renders footer with role="contentinfo"', () => {
    render(<MangaReader {...defaultProps} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeDefined();
  });

  it('renders navigation buttons with aria-labels', () => {
    render(<MangaReader {...defaultProps} />);

    // There are multiple "Página anterior" buttons (footer + invisible overlay)
    const prevButtons = screen.getAllByRole('button', {
      name: /página anterior/i,
    });
    expect(prevButtons.length).toBeGreaterThanOrEqual(1);

    // There are multiple "Página siguiente" buttons (footer + invisible overlay)
    const nextButtons = screen.getAllByRole('button', {
      name: /página siguiente/i,
    });
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders image with alt text for current page', () => {
    render(<MangaReader {...defaultProps} />);

    const images = screen.getAllByAltText(/página/i);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('alt', expect.stringContaining('Página'));
  });

  it('renders toolbar buttons with aria-labels', () => {
    render(<MangaReader {...defaultProps} />);

    // "Acercar" exists in both header and footer — getAllByRole
    const zoomInButtons = screen.getAllByRole('button', { name: /acercar/i });
    expect(zoomInButtons.length).toBeGreaterThanOrEqual(1);

    // "Alejar" exists in both header and footer
    const zoomOutButtons = screen.getAllByRole('button', { name: /alejar/i });
    expect(zoomOutButtons.length).toBeGreaterThanOrEqual(1);

    // "Ajustes" should be unique
    const settingsButton = screen.getByRole('button', { name: /ajustes/i });
    expect(settingsButton).toBeDefined();
  });

  it('renders settings dialog with role="dialog" and aria-modal when opened', async () => {
    render(<MangaReader {...defaultProps} />);

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /ajustes/i });
    settingsButton.click();

    // Wait for the dialog to appear (state update is synchronous with fireEvent)
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'reader-settings-title');
  });

  it('renders help dialog with role="dialog" and aria-modal when opened', async () => {
    render(<MangaReader {...defaultProps} />);

    // Open help
    const helpButton = screen.getByRole('button', { name: /ayuda/i });
    helpButton.click();

    // The help dialog's accessible name comes from aria-labelledby="reader-help-title"
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'reader-help-title');
  });

  it('renders setting dialog heading with id', async () => {
    render(<MangaReader {...defaultProps} />);

    const settingsButton = screen.getByRole('button', { name: /ajustes/i });
    settingsButton.click();

    const heading = await screen.findByRole('heading', { name: /ajustes de lectura/i });
    expect(heading).toBeDefined();
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations in default state', async () => {
      const { container } = render(<MangaReader {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with settings open', async () => {
      const { container } = render(<MangaReader {...defaultProps} />);

      const settingsButton = screen.getByRole('button', { name: /ajustes/i });
      settingsButton.click();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with help dialog open', async () => {
      const { container } = render(<MangaReader {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: /ayuda/i });
      helpButton.click();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
