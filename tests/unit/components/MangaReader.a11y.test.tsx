import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock native Image constructor used for preloading in MangaReader
class MockImage {
  src: string = '';
}
vi.stubGlobal('Image', MockImage as unknown as typeof Image);

// Mock framer-motion with Proxy to handle all motion.* elements
vi.mock('framer-motion', () => {
  const Div = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  return {
    motion: new Proxy({}, { get: () => Div }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock next/image - use a regular function handling both:
// 1. Constructor call (no props) for preloading: new Image()
// 2. Component call with JSX: <Image alt="..." />
vi.mock('next/image', () => ({
  default: function MockNextImage(props?: any) {
    if (!props) return null; // Called as constructor via `new Image()`
    const { alt, ...rest } = props;
    return <img alt={alt} {...rest} />;
  },
}));

// Mock useReadingProgress
vi.mock('@/hooks/useReadingProgress', () => ({
  useAutoSaveProgress: vi.fn(),
}));

// Mock OptimizedImage
vi.mock('@/components/Image/OptimizedImage', () => ({
  OptimizedImage: ({ alt, ...props }: any) => (
    <img alt={alt || 'imagen'} data-testid="optimized-image" {...props} />
  ),
}));

// Mock dynamic imports
vi.mock('@/components/Reader/QuizPopup', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="quiz-popup">Quiz</div> : null,
}));

vi.mock('@/components/Reader/SponsorshipModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="sponsorship-modal">Sponsor</div> : null,
}));

vi.mock('@/components/Reader/MemeGeneratorModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="meme-modal">Meme</div> : null,
}));

vi.mock('@/components/Reader/EditorModeOverlay', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="editor-overlay">Editor</div> : null,
}));

import { MangaReader } from '@/components/Reader/MangaReader';

const defaultProps = {
  pages: ['/page1.jpg', '/page2.jpg', '/page3.jpg'],
  chapterNumber: 1,
  mangaTitle: 'Test Manga',
  mangaSlug: 'test-manga',
  mangaId: 'manga-1',
  chapterId: 'chapter-1',
  totalChapters: 5,
  initialPage: 0,
};

describe('MangaReader - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<MangaReader {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it('has accessible navigation buttons', () => {
    render(<MangaReader {...defaultProps} />);
    // Some buttons may appear in both toolbar and context menus, use getAllBy to verify presence
    const zoomOut = screen.getAllByLabelText('Alejar');
    const zoomIn = screen.getAllByLabelText('Acercar');
    const zoomReset = screen.getAllByLabelText('Restablecer zoom');
    const fullscreen = screen.getAllByLabelText('Pantalla completa');
    const help = screen.getAllByLabelText('Ayuda');
    expect(zoomOut.length).toBeGreaterThanOrEqual(1);
    expect(zoomIn.length).toBeGreaterThanOrEqual(1);
    expect(zoomReset.length).toBeGreaterThanOrEqual(1);
    expect(fullscreen.length).toBeGreaterThanOrEqual(1);
    expect(help.length).toBeGreaterThanOrEqual(1);
  });

  it('has progress bar with accessible label', () => {
    render(<MangaReader {...defaultProps} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeDefined();
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows page count in the footer', () => {
    const { container } = render(<MangaReader {...defaultProps} />);
    // Page count may appear in multiple elements; check that at least one exists
    const pageCounts = screen.getAllByText('1 / 3');
    expect(pageCounts.length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain('33%');
  });

  it('has back button linking to manga page', () => {
    render(<MangaReader {...defaultProps} />);
    const backLink = screen.getByText('Volver').closest('a');
    expect(backLink).toHaveAttribute('href', '/manga/test-manga');
  });

  it('shows chapter title and manga name', () => {
    render(<MangaReader {...defaultProps} />);
    expect(screen.getByText('Test Manga')).toBeDefined();
    expect(screen.getByText('Capítulo 1')).toBeDefined();
  });
});
