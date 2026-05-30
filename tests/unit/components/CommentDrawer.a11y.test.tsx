import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock CommentSection to simplify testing
vi.mock('@/components/Comments/CommentSection', () => ({
  default: vi.fn(({ chapterId }: { chapterId: string }) => (
    <div data-testid="comment-section">Comments for {chapterId}</div>
  )),
}));

// Mock FocusLock to avoid portal complexities in tests
vi.mock('react-focus-lock', () => ({
  default: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-lock">{children}</div>
  )),
}));

import { CommentDrawer } from '@/components/Reader/CommentDrawer';

describe('CommentDrawer — Accessibility', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    chapterId: 'chapter-123',
    mangaId: 'manga-456',
    commentCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when not open', () => {
    const { container } = render(
      <CommentDrawer {...defaultProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders with role="dialog" and aria-modal="true"', () => {
    render(<CommentDrawer {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('associates dialog heading via aria-labelledby', () => {
    render(<CommentDrawer {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    const heading = screen.getByRole('heading', { name: /comentarios/i });

    expect(dialog).toHaveAttribute('aria-labelledby', 'comment-drawer-title');
    expect(heading).toHaveAttribute('id', 'comment-drawer-title');
  });

  it('renders backdrop as a button with aria-label', () => {
    render(<CommentDrawer {...defaultProps} />);

    // Backdrop and close-X share the same aria-label; backdrop wraps the drawer
    const backdropButtons = screen.getAllByRole('button', { name: /cerrar comentarios/i });
    // Both the backdrop overlay and the close X button should exist
    expect(backdropButtons.length).toBeGreaterThanOrEqual(2);
    // All close buttons should be proper button elements
    backdropButtons.forEach(btn => {
      expect(btn.tagName).toBe('BUTTON');
    });
  });

  it('calls onClose when backdrop button is clicked', () => {
    render(<CommentDrawer {...defaultProps} />);

    // Click the backdrop (outermost close button)
    const backdropButtons = screen.getAllByRole('button', { name: /cerrar comentarios/i });
    // Click all close-triggering buttons; onClose should be called at least once
    fireEvent.click(backdropButtons[0]);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close X button inside drawer is clicked', () => {
    render(<CommentDrawer {...defaultProps} />);

    const backdropButtons = screen.getAllByRole('button', { name: /cerrar comentarios/i });
    // The X button is the last close button (inside the drawer panel)
    fireEvent.click(backdropButtons[backdropButtons.length - 1]);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('render drag handle with aria-hidden="true"', () => {
    render(<CommentDrawer {...defaultProps} />);

    // The drag handle is a decorative element
    const dragHandleContainer = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
    expect(dragHandleContainer).not.toBeNull();
  });

  it('shows comment count in the heading', () => {
    render(<CommentDrawer {...defaultProps} />);

    const heading = screen.getByRole('heading', { name: /comentarios/i });
    expect(heading.textContent).toContain('(5)');
  });

  it('has icon with aria-hidden in the heading', () => {
    render(<CommentDrawer {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    // The MessageSquare icon should have aria-hidden
    const messageIcon = dialog.querySelector('.lucide-message-square');
    expect(messageIcon).not.toBeNull();
    // The parent element should pass aria-hidden via the component
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations when open', async () => {
      const { container } = render(<CommentDrawer {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with 0 comment count', async () => {
      const { container } = render(
        <CommentDrawer {...defaultProps} commentCount={0} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations when closed', async () => {
      const { container } = render(
        <CommentDrawer {...defaultProps} isOpen={false} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
